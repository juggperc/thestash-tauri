const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (fileId, fileBuffer, fileName) =>
    ipcRenderer.invoke('electron:save-file', fileId, fileBuffer, fileName),
  
  loadFile: (fileId, fileName) =>
    ipcRenderer.invoke('electron:load-file', fileId, fileName),
  
  deleteFile: (fileId, fileName) =>
    ipcRenderer.invoke('electron:delete-file', fileId, fileName),
  
  loadMetadata: () =>
    ipcRenderer.invoke('electron:load-metadata'),
  
  saveMetadata: (metadata) =>
    ipcRenderer.invoke('electron:save-metadata', metadata),
  
  getFilePath: (fileId, fileName) =>
    ipcRenderer.invoke('electron:get-file-path', fileId, fileName),
  
  isElectron: true,
})
