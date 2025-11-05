/**
 * Electron-specific storage utilities
 * Handles file persistence to disk when running in Electron
 */

declare global {
  interface Window {
    electronAPI?: {
      saveFile: (fileId: string, fileBuffer: number[], fileName: string) => Promise<{ success: boolean; path?: string; error?: string }>
      loadFile: (fileId: string, fileName: string) => Promise<{ success: boolean; buffer?: number[]; error?: string }>
      deleteFile: (fileId: string, fileName: string) => Promise<{ success: boolean; error?: string }>
      loadMetadata: () => Promise<{ files: any[] }>
      saveMetadata: (metadata: { files: any[] }) => Promise<{ success: boolean; error?: string }>
      getFilePath: (fileId: string, fileName: string) => Promise<string>
      isElectron: boolean
    }
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true
}

export async function saveFileToElectron(fileId: string, file: File): Promise<boolean> {
  if (!isElectron() || !window.electronAPI) return false

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Array.from(new Uint8Array(arrayBuffer))
    const result = await window.electronAPI.saveFile(fileId, buffer, file.name)
    return result.success
  } catch (error) {
    console.error('Error saving file to Electron:', error)
    return false
  }
}

export async function loadFileFromElectron(fileId: string, fileName: string): Promise<File | null> {
  if (!isElectron() || !window.electronAPI) return null

  try {
    const result = await window.electronAPI.loadFile(fileId, fileName)
    if (!result.success || !result.buffer) return null

    const buffer = new Uint8Array(result.buffer)
    const blob = new Blob([buffer])
    return new File([blob], fileName, { type: 'audio/mpeg' })
  } catch (error) {
    console.error('Error loading file from Electron:', error)
    return null
  }
}

export async function deleteFileFromElectron(fileId: string, fileName: string): Promise<boolean> {
  if (!isElectron() || !window.electronAPI) return false

  try {
    const result = await window.electronAPI.deleteFile(fileId, fileName)
    return result.success
  } catch (error) {
    console.error('Error deleting file from Electron:', error)
    return false
  }
}

export async function loadMetadataFromElectron(): Promise<any[]> {
  if (!isElectron() || !window.electronAPI) return []

  try {
    const result = await window.electronAPI.loadMetadata()
    return result.files || []
  } catch (error) {
    console.error('Error loading metadata from Electron:', error)
    return []
  }
}

export async function saveMetadataToElectron(metadata: { files: any[] }): Promise<boolean> {
  if (!isElectron() || !window.electronAPI) return false

  try {
    const result = await window.electronAPI.saveMetadata(metadata)
    return result.success
  } catch (error) {
    console.error('Error saving metadata to Electron:', error)
    return false
  }
}

export async function getElectronFilePath(fileId: string, fileName: string): Promise<string | null> {
  if (!isElectron() || !window.electronAPI) return null

  try {
    return await window.electronAPI.getFilePath(fileId, fileName)
  } catch (error) {
    console.error('Error getting file path from Electron:', error)
    return null
  }
}

