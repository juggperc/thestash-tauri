"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AudioFile } from "@/store/audio-store"
import { useAudioStore } from "@/store/audio-store"

interface AudioPlayerProps {
  file: AudioFile
  onClose: () => void
}

export function AudioPlayer({ file, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const { getFile } = useAudioStore()

  useEffect(() => {
    let url: string | null = null
    
    const loadFile = async () => {
      const fileObj = await getFile(file.id)
      if (fileObj) {
        url = URL.createObjectURL(fileObj)
        setAudioUrl(url)
      } else if (typeof file.file === 'string') {
        setAudioUrl(file.file)
      }
    }
    
    loadFile()
    
    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [file, getFile])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    // Reset state when audio source changes
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)

    const updateTime = () => {
      if (audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime)
      }
    }
    
    const updateDuration = () => {
      if (audio.duration !== undefined && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleLoadedMetadata = () => {
      updateDuration()
    }

    const handleCanPlay = () => {
      updateDuration()
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("durationchange", updateDuration)
    audio.addEventListener("ended", handleEnded)

    // Also check duration immediately
    if (audio.readyState >= 1) {
      updateDuration()
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("durationchange", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl])

  useEffect(() => {
    // Center the window on mount
    if (typeof window !== 'undefined') {
      setPosition({
        x: (window.innerWidth - 320) / 2,
        y: (window.innerHeight - 120) / 2,
      })
    }
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const playerWidth = 320 // w-80 = 320px
      const playerHeight = 140 // approximate height
      
      let newX = e.clientX - dragOffset.x
      let newY = e.clientY - dragOffset.y
      
      // Constrain to viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - playerWidth))
      newY = Math.max(0, Math.min(newY, window.innerHeight - playerHeight))
      
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleDragStart = (e: React.MouseEvent) => {
    if (!playerRef.current) return
    const rect = playerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch((error) => {
        console.error('Error playing audio:', error)
      })
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  // Sync play state with audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    // Sync initial state
    setIsPlaying(!audio.paused)

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [audioUrl])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={playerRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-50 w-80"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        <Card className="border-2 border-border shadow-lg select-none">
          <CardHeader
            ref={dragHandleRef}
            onMouseDown={handleDragStart}
            className="cursor-grab active:cursor-grabbing border-b-2 border-border pb-2 select-none"
          >
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-2 flex-1 min-w-0 select-none">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <CardTitle className="font-mono text-sm font-medium truncate lowercase select-none">
                  {file.name}
                </CardTitle>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="shrink-0 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 select-none">
            <div className="flex items-center gap-3 select-none">
              <Button
                size="icon"
                onClick={togglePlay}
                className="shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1 min-w-0 select-none">
                <div className="flex items-center gap-2 select-none">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-secondary accent-foreground cursor-pointer"
                  />
                  <span className="font-mono text-xs text-muted-foreground whitespace-nowrap shrink-0 select-none">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>

            {audioUrl && (
              <audio 
                ref={audioRef} 
                src={audioUrl}
                preload="metadata"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
