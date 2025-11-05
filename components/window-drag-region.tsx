"use client"

import { useEffect, useState } from "react"

export function WindowDragRegion() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Check if running in Electron or Tauri
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__
    
    if (isElectron || isTauri) {
      setIsDesktop(true)
      document.body.classList.add('desktop-app')
      if (isElectron) {
        document.body.classList.add('electron-app')
      }
      if (isTauri) {
        document.body.classList.add('tauri-app')
      }
      
      return () => {
        document.body.classList.remove('desktop-app', 'electron-app', 'tauri-app')
      }
    }
  }, [])

  if (!isDesktop) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-8 z-[10000] electron-drag-region"
      style={{
        WebkitAppRegion: 'drag',
        pointerEvents: 'auto',
      } as React.CSSProperties}
    />
  )
}

