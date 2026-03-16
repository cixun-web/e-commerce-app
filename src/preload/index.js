import { contextBridge, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getPathForFile: (file) => webUtils.getPathForFile(file)
}

const invoke = (params) => electronAPI.ipcRenderer.invoke('handleEvent', params)

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('invoke', invoke)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.invoke = invoke
  window.api = api
}
