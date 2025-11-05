import { create } from 'zustand'
import {
  isElectron,
  saveFileToElectron,
  loadFileFromElectron,
  deleteFileFromElectron,
  loadMetadataFromElectron,
  saveMetadataToElectron,
} from '@/lib/electron-storage'

export interface AudioFile {
  id: string
  name: string
  file: File | string
  key?: string
  bpm?: number
  tags: string[]
  uploadedAt: Date
}

interface AudioStore {
  files: AudioFile[]
  fileCache: Map<string, File>
  hydrated: boolean
  hydrate: () => Promise<void>
  addFile: (file: AudioFile) => Promise<void>
  updateFile: (id: string, updates: Partial<AudioFile>) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  filteredFiles: (filters: { key?: string; bpm?: number; minBpm?: number; maxBpm?: number }) => AudioFile[]
  getFile: (id: string) => Promise<File | null>
}

// Simple in-memory storage with localStorage backup (without File objects)
const STORAGE_KEY = 'the-stash-audio'

async function loadFromStorage(): Promise<Omit<AudioFile, 'file'>[]> {
  if (typeof window === 'undefined') return []
  
  // Try Electron storage first
  if (isElectron()) {
    try {
      const electronMetadata = await loadMetadataFromElectron()
      if (electronMetadata && electronMetadata.length > 0) {
        return electronMetadata.map((f: any) => ({
          ...f,
          uploadedAt: new Date(f.uploadedAt),
        }))
      }
    } catch (error) {
      console.error('Error loading from Electron storage:', error)
    }
  }
  
  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return parsed.map((f: any) => ({
      ...f,
      uploadedAt: new Date(f.uploadedAt),
    }))
  } catch {
    return []
  }
}

async function saveToStorage(files: AudioFile[]) {
  if (typeof window === 'undefined') return
  
  const toStore = files.map(f => ({
    id: f.id,
    name: f.name,
    key: f.key,
    bpm: f.bpm,
    tags: f.tags,
    uploadedAt: f.uploadedAt.toISOString(),
  }))
  
  // Save to Electron storage if available
  if (isElectron()) {
    try {
      await saveMetadataToElectron({ files: toStore })
    } catch (error) {
      console.error('Error saving to Electron storage:', error)
    }
  }
  
  // Also save to localStorage as backup
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // Ignore storage errors
  }
}

export const useAudioStore = create<AudioStore>((set, get) => {
  const fileCache = new Map<string, File>()

  return {
    files: [],
    fileCache,
    hydrated: false,
    hydrate: async () => {
      if (get().hydrated) return
      
      const stored = await loadFromStorage()
      
      if (stored.length > 0) {
        // In Electron, load files from disk
        if (isElectron()) {
          const filesWithData: AudioFile[] = []
          
          for (const fileMeta of stored) {
            try {
              const file = await loadFileFromElectron(fileMeta.id, fileMeta.name)
              if (file) {
                fileCache.set(fileMeta.id, file)
                filesWithData.push({ ...fileMeta, file })
              } else {
                // Fallback to name string if file not found
                filesWithData.push({ ...fileMeta, file: fileMeta.name })
              }
            } catch (error) {
              console.error(`Error loading file ${fileMeta.id}:`, error)
              filesWithData.push({ ...fileMeta, file: fileMeta.name })
            }
          }
          
          set({ files: filesWithData, hydrated: true })
        } else {
          // Browser: use in-memory cache
          const initialFiles = stored.map(f => ({ ...f, file: f.name }))
          set({ files: initialFiles, hydrated: true })
        }
      } else {
        set({ hydrated: true })
      }
    },
    addFile: async (file) => {
      // Save file to disk if in Electron
      if (file.file instanceof File && isElectron()) {
        try {
          await saveFileToElectron(file.id, file.file)
          fileCache.set(file.id, file.file)
        } catch (error) {
          console.error('Error saving file to Electron:', error)
          // Still add to cache for immediate use
          fileCache.set(file.id, file.file)
        }
      } else if (file.file instanceof File) {
        // Browser: keep in memory cache
        fileCache.set(file.id, file.file)
      }
      
      set((state) => {
        const newFiles = [...state.files, { ...file, file: file.name }]
        saveToStorage(newFiles)
        return { files: newFiles }
      })
    },
    updateFile: async (id, updates) => {
      set((state) => {
        const newFiles = state.files.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        )
        saveToStorage(newFiles)
        return { files: newFiles }
      })
    },
    deleteFile: async (id) => {
      const file = get().files.find(f => f.id === id)
      
      // Delete from disk if in Electron
      if (file && isElectron()) {
        try {
          await deleteFileFromElectron(file.id, file.name)
        } catch (error) {
          console.error('Error deleting file from Electron:', error)
        }
      }
      
      fileCache.delete(id)
      set((state) => {
        const newFiles = state.files.filter((f) => f.id !== id)
        saveToStorage(newFiles)
        return { files: newFiles }
      })
    },
    filteredFiles: (filters) => {
      const { files } = get()
      return files.filter((file) => {
        if (filters.key && file.key !== filters.key) return false
        if (filters.bpm && file.bpm !== filters.bpm) return false
        if (filters.minBpm && file.bpm && file.bpm < filters.minBpm) return false
        if (filters.maxBpm && file.bpm && file.bpm > filters.maxBpm) return false
        return true
      })
    },
    getFile: async (id) => {
      // Check cache first
      const cached = fileCache.get(id)
      if (cached) return cached
      
      // In Electron, try loading from disk
      if (isElectron()) {
        const fileMeta = get().files.find(f => f.id === id)
        if (fileMeta) {
          try {
            const file = await loadFileFromElectron(fileMeta.id, fileMeta.name)
            if (file) {
              fileCache.set(id, file)
              return file
            }
          } catch (error) {
            console.error('Error loading file from Electron:', error)
          }
        }
      }
      
      return null
    },
  }
})
