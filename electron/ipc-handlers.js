const { ipcMain } = require('electron')
const fs = require('fs').promises
const path = require('path')
const { app } = require('electron')

const STORAGE_DIR = path.join(app.getPath('userData'), 'audio-files')
const METADATA_FILE = path.join(app.getPath('userData'), 'metadata.json')

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating storage directory:', error)
  }
}

// Initialize storage directory on app ready
app.whenReady().then(() => {
  ensureStorageDir()
})

// Save file to disk
async function saveFileToDisk(fileId, fileBuffer, fileName) {
  await ensureStorageDir()
  const filePath = path.join(STORAGE_DIR, `${fileId}-${fileName}`)
  await fs.writeFile(filePath, fileBuffer)
  return filePath
}

// Delete file from disk
async function deleteFileFromDisk(fileId, fileName) {
  try {
    const filePath = path.join(STORAGE_DIR, `${fileId}-${fileName}`)
    await fs.unlink(filePath)
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

// Load metadata
async function loadMetadata() {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { files: [] }
  }
}

// Save metadata
async function saveMetadata(metadata) {
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2))
}

// IPC Handlers
ipcMain.handle('electron:save-file', async (event, fileId, fileBuffer, fileName) => {
  try {
    const filePath = await saveFileToDisk(fileId, Buffer.from(fileBuffer), fileName)
    return { success: true, path: filePath }
  } catch (error) {
    console.error('Error saving file:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('electron:load-file', async (event, fileId, fileName) => {
  try {
    const filePath = path.join(STORAGE_DIR, `${fileId}-${fileName}`)
    const buffer = await fs.readFile(filePath)
    return { success: true, buffer: Array.from(buffer) }
  } catch (error) {
    console.error('Error loading file:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('electron:delete-file', async (event, fileId, fileName) => {
  try {
    await deleteFileFromDisk(fileId, fileName)
    return { success: true }
  } catch (error) {
    console.error('Error deleting file:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('electron:load-metadata', async () => {
  return await loadMetadata()
})

ipcMain.handle('electron:save-metadata', async (event, metadata) => {
  try {
    await saveMetadata(metadata)
    return { success: true }
  } catch (error) {
    console.error('Error saving metadata:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('electron:get-file-path', async (event, fileId, fileName) => {
  const filePath = path.join(STORAGE_DIR, `${fileId}-${fileName}`)
  return filePath
})

