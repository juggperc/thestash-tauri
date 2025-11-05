"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Upload as UploadIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAudioStore } from "@/store/audio-store"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const { addFile } = useAudioStore()
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files).filter(file => file.type.startsWith("audio/"))
    
    try {
      for (const file of fileArray) {
        const audioFile = {
          id: crypto.randomUUID(),
          name: file.name,
          file: file,
          tags: [],
          uploadedAt: new Date(),
        }

        try {
          await addFile(audioFile)
        } catch (error) {
          console.error('Error adding file:', error)
        }
      }
    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      router.push("/")
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-mono text-4xl font-bold mb-2 lowercase tracking-tight">upload</h1>
        <p className="font-mono text-muted-foreground mb-8 lowercase">
          upload mp3 or wav files to your stash
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-dashed transition-all ${
            dragActive ? "border-foreground bg-accent scale-[1.02]" : "hover:border-foreground/50"
          }`}
        >
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <UploadIcon className="h-12 w-12 text-muted-foreground" />
              </motion.div>
              <div>
                <CardTitle className="font-mono mb-2 lowercase">
                  drop audio files here
                </CardTitle>
                <CardDescription className="font-mono lowercase">
                  or click to browse
                </CardDescription>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/wav,audio/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="font-mono lowercase"
              >
                select files
              </Button>
              <div className="pt-4 border-t border-border w-full">
                <p className="font-mono text-xs text-muted-foreground mb-2 lowercase">
                  need to detect bpm?
                </p>
                <a
                  href="https://tunebat.com/Analyzer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-sm text-foreground hover:text-muted-foreground transition-colors lowercase"
                >
                  tunebat bpm detector
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

