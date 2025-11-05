"use client"

import { useEffect, useState } from "react"

export function WindowDragRegion() {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
      setIsElectron(true)
      document.body.classList.add('electron-app')
      
      return () => {
        document.body.classList.remove('electron-app')
      }
    }
  }, [])

  if (!isElectron) return null

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

