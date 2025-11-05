// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;

#[derive(serde::Serialize)]
struct FileResult {
    success: bool,
    path: Option<String>,
    error: Option<String>,
}

#[derive(serde::Serialize)]
struct LoadFileResult {
    success: bool,
    buffer: Option<Vec<u8>>,
    error: Option<String>,
}

#[derive(serde::Serialize)]
struct MetadataResult {
    success: bool,
    error: Option<String>,
}

fn get_storage_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path_resolver()
        .app_data_dir()
        .unwrap()
        .join("audio-files")
}

fn get_metadata_file(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path_resolver()
        .app_data_dir()
        .unwrap()
        .join("metadata.json")
}

#[tauri::command]
async fn ensure_storage_dir(app_handle: tauri::AppHandle) -> Result<(), String> {
    let storage_dir = get_storage_dir(&app_handle);
    fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn save_file(
    app_handle: tauri::AppHandle,
    file_id: String,
    file_buffer: Vec<u8>,
    file_name: String,
) -> Result<FileResult, String> {
    ensure_storage_dir(app_handle.clone()).await?;
    
    let storage_dir = get_storage_dir(&app_handle);
    let file_path = storage_dir.join(format!("{}-{}", file_id, file_name));
    
    match fs::write(&file_path, file_buffer) {
        Ok(_) => Ok(FileResult {
            success: true,
            path: Some(file_path.to_string_lossy().to_string()),
            error: None,
        }),
        Err(e) => Ok(FileResult {
            success: false,
            path: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
async fn load_file(
    app_handle: tauri::AppHandle,
    file_id: String,
    file_name: String,
) -> Result<LoadFileResult, String> {
    let storage_dir = get_storage_dir(&app_handle);
    let file_path = storage_dir.join(format!("{}-{}", file_id, file_name));
    
    match fs::read(&file_path) {
        Ok(buffer) => Ok(LoadFileResult {
            success: true,
            buffer: Some(buffer),
            error: None,
        }),
        Err(e) => Ok(LoadFileResult {
            success: false,
            buffer: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
async fn delete_file(
    app_handle: tauri::AppHandle,
    file_id: String,
    file_name: String,
) -> Result<MetadataResult, String> {
    let storage_dir = get_storage_dir(&app_handle);
    let file_path = storage_dir.join(format!("{}-{}", file_id, file_name));
    
    match fs::remove_file(&file_path) {
        Ok(_) => Ok(MetadataResult {
            success: true,
            error: None,
        }),
        Err(e) => Ok(MetadataResult {
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
async fn load_metadata(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let metadata_file = get_metadata_file(&app_handle);
    
    match fs::read_to_string(&metadata_file) {
        Ok(content) => {
            serde_json::from_str(&content).map_err(|e| e.to_string())
        }
        Err(_) => {
            // Return empty metadata if file doesn't exist
            Ok(serde_json::json!({ "files": [] }))
        }
    }
}

#[tauri::command]
async fn save_metadata(
    app_handle: tauri::AppHandle,
    metadata: serde_json::Value,
) -> Result<MetadataResult, String> {
    let metadata_file = get_metadata_file(&app_handle);
    
    // Ensure app data directory exists
    if let Some(parent) = metadata_file.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    let content = serde_json::to_string_pretty(&metadata).map_err(|e| e.to_string())?;
    
    match fs::write(&metadata_file, content) {
        Ok(_) => Ok(MetadataResult {
            success: true,
            error: None,
        }),
        Err(e) => Ok(MetadataResult {
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
async fn get_file_path(
    app_handle: tauri::AppHandle,
    file_id: String,
    file_name: String,
) -> Result<String, String> {
    let storage_dir = get_storage_dir(&app_handle);
    let file_path = storage_dir.join(format!("{}-{}", file_id, file_name));
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn is_tauri() -> bool {
    true
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Ensure storage directory exists on startup
            let app_handle = app.handle();
            let storage_dir = get_storage_dir(&app_handle);
            if let Err(e) = fs::create_dir_all(&storage_dir) {
                eprintln!("Error creating storage directory: {}", e);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_file,
            load_file,
            delete_file,
            load_metadata,
            save_metadata,
            get_file_path,
            is_tauri
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

