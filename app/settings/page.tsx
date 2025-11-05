"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { useAudioStore } from "@/store/audio-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { isElectron } from "@/lib/electron-storage"

export default function SettingsPage() {
  const { files, deleteFile, hydrate } = useAudioStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const handleClearAll = async () => {
    if (confirm("are you sure you want to delete all tracks? this cannot be undone.")) {
      for (const file of files) {
        await deleteFile(file.id)
      }
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-mono text-4xl font-bold mb-2 lowercase tracking-tight">settings</h1>
        <p className="font-mono text-muted-foreground lowercase">
          manage your stash preferences
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="font-mono lowercase">storage</CardTitle>
            <CardDescription className="font-mono lowercase">
              {files.length} {files.length === 1 ? "track" : "tracks"} stored
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-mono text-sm text-muted-foreground lowercase">
                {isElectron() 
                  ? "all data is stored locally on your computer. files are saved to disk and persist between sessions."
                  : "all data is stored locally in your browser. clearing your browser data will remove all tracks."}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="font-mono lowercase"
              disabled={files.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              clear all tracks
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="font-mono lowercase">about</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-muted-foreground lowercase">
              the stash — mp3/wav storage and management
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

