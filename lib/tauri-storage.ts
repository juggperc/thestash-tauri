/**
 * Tauri-specific storage utilities
 * Handles file persistence to disk when running in Tauri
 */

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false
  // @ts-ignore - __TAURI__ is injected by Tauri at runtime
  return window.__TAURI__ !== undefined
}

// Dynamic imports to avoid SSR issues
async function getTauriInvoke() {
  if (!isTauri()) return null
  const { invoke } = await import('@tauri-apps/api/tauri')
  return invoke
}

export async function saveFileToTauri(fileId: string, file: File): Promise<boolean> {
  if (!isTauri()) return false

  try {
    const invoke = await getTauriInvoke()
    if (!invoke) return false
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Array.from(new Uint8Array(arrayBuffer))
    const result = await invoke<{ success: boolean; path?: string; error?: string }>('save_file', {
      fileId,
      fileBuffer: buffer,
      fileName: file.name,
    })
    return result.success
  } catch (error) {
    console.error('Error saving file to Tauri:', error)
    return false
  }
}

export async function loadFileFromTauri(fileId: string, fileName: string): Promise<File | null> {
  if (!isTauri()) return null

  try {
    const invoke = await getTauriInvoke()
    if (!invoke) return null
    
    const result = await invoke<{ success: boolean; buffer?: number[]; error?: string }>('load_file', {
      fileId,
      fileName,
    })
    if (!result.success || !result.buffer) return null

    const buffer = new Uint8Array(result.buffer)
    const blob = new Blob([buffer])
    return new File([blob], fileName, { type: 'audio/mpeg' })
  } catch (error) {
    console.error('Error loading file from Tauri:', error)
    return null
  }
}

export async function deleteFileFromTauri(fileId: string, fileName: string): Promise<boolean> {
  if (!isTauri()) return false

  try {
    const invoke = await getTauriInvoke()
    if (!invoke) return false
    
    const result = await invoke<{ success: boolean; error?: string }>('delete_file', {
      fileId,
      fileName,
    })
    return result.success
  } catch (error) {
    console.error('Error deleting file from Tauri:', error)
    return false
  }
}

export async function loadMetadataFromTauri(): Promise<any[]> {
  if (!isTauri()) return []

  try {
    const invoke = await getTauriInvoke()
    if (!invoke) return []
    
    const result = await invoke<{ files: any[] }>('load_metadata')
    return result.files || []
  } catch (error) {
    console.error('Error loading metadata from Tauri:', error)
    return []
  }
}

export async function saveMetadataToTauri(metadata: { files: any[] }): Promise<boolean> {
  if (!isTauri()) return false

  try {
    const invoke = await getTauriInvoke()
    if (!invoke) return false
    
    const result = await invoke<{ success: boolean; error?: string }>('save_metadata', {
      metadata,
    })
    return result.success
  } catch (error) {
    console.error('Error saving metadata to Tauri:', error)
    return false
  }
}

export async function getTauriFilePath(fileId: string, fileName: string): Promise<string | null> {
  if (!isTauri()) return null

  try {
    const invoke = await getTauriInvoke()
    if (!invoke) return null
    
    return await invoke<string>('get_file_path', {
      fileId,
      fileName,
    })
  } catch (error) {
    console.error('Error getting file path from Tauri:', error)
    return null
  }
}

// Helper for window dragging in Tauri
export async function startDragging() {
  if (!isTauri()) return
  try {
    const { appWindow } = await import('@tauri-apps/api/window')
    await appWindow.startDragging()
  } catch (error) {
    console.error('Error starting drag:', error)
  }
}

