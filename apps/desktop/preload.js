/**
 * Mywork-DSH_desktop — preload for the dsh window.
 *
 * Exposes one small, promise-based bridge (`window.myworkDesktop`) that the MyWork Kit browser
 * plugin uses to drive the NATIVE browser tabs of the desktop shell (real Chromium views embedded
 * in the window, Claude-Code style) instead of streaming screenshots of a background Chrome.
 * Nothing else of Node or Electron is reachable from the page.
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('myworkDesktop', {
  isDesktop: true,
  version: 1,
  browser: {
    /** Open a native tab; resolves to its CDP target id (the same id the plugin sees on the DevTools port). */
    newTab: (url) => ipcRenderer.invoke('mywork:browser:new-tab', { url: String(url || 'about:blank') }),
    /** Bring one tab to the front of the embedded view. */
    select: (targetId) => ipcRenderer.invoke('mywork:browser:select', { targetId: String(targetId || '') }),
    /** Close a tab (its view is destroyed). */
    closeTab: (targetId) => ipcRenderer.invoke('mywork:browser:close', { targetId: String(targetId || '') }),
    /** Where the live pane sits in window CSS px; null hides the view. Called on every resize / scroll of the pane. */
    setBounds: (rect) => ipcRenderer.invoke('mywork:browser:bounds', rect ? { x: Number(rect.x) || 0, y: Number(rect.y) || 0, width: Number(rect.width) || 0, height: Number(rect.height) || 0 } : null),
    /** Current native tabs: [{ targetId, url, title }]. */
    list: () => ipcRenderer.invoke('mywork:browser:list'),
  },
})
