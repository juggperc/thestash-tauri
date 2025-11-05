"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { useAudioStore } from "@/store/audio-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Play, Trash2, Edit2 } from "lucide-react"
import { AudioPlayer } from "@/components/audio-player"
import { EditAudioDialog } from "@/components/edit-audio-dialog"

const MUSIC_KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
]

export default function Home() {
  const { files, deleteFile, filteredFiles, hydrate } = useAudioStore()
  const [selectedKey, setSelectedKey] = useState<string>("")
  const [bpmFilter, setBpmFilter] = useState<string>("")
  const [minBpm, setMinBpm] = useState<string>("")
  const [maxBpm, setMaxBpm] = useState<string>("")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const filtered = useMemo(() => {
    return filteredFiles({
      key: selectedKey || undefined,
      bpm: bpmFilter ? parseInt(bpmFilter) : undefined,
      minBpm: minBpm ? parseInt(minBpm) : undefined,
      maxBpm: maxBpm ? parseInt(maxBpm) : undefined,
    })
  }, [selectedKey, bpmFilter, minBpm, maxBpm, filteredFiles])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-mono text-4xl font-bold mb-2 lowercase tracking-tight">library</h1>
        <p className="font-mono text-muted-foreground lowercase">
          {filtered.length} {filtered.length === 1 ? "track" : "tracks"}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="space-y-2">
          <label className="font-mono text-sm font-medium lowercase">filter by key</label>
          <Select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            <option value="">all keys</option>
            {MUSIC_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-sm font-medium lowercase">exact bpm</label>
          <Input
            type="number"
            placeholder="bpm"
            value={bpmFilter}
            onChange={(e) => setBpmFilter(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="font-mono text-sm font-medium lowercase">min bpm</label>
          <Input
            type="number"
            placeholder="min"
            value={minBpm}
            onChange={(e) => setMinBpm(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="font-mono text-sm font-medium lowercase">max bpm</label>
          <Input
            type="number"
            placeholder="max"
            value={maxBpm}
            onChange={(e) => setMaxBpm(e.target.value)}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Card className="h-full flex flex-col hover:border-foreground transition-colors">
              <CardHeader>
                <CardTitle className="font-mono text-lg truncate lowercase">
                  {file.name}
                </CardTitle>
                <CardDescription className="font-mono lowercase">
                  {file.key && `key: ${file.key}`}
                  {file.key && file.bpm && " • "}
                  {file.bpm && `bpm: ${file.bpm}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {file.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-xs border-2 border-border px-2 py-1 lowercase hover:bg-foreground hover:text-background transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setPlayingId(file.id)}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setEditingId(file.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => deleteFile(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="font-mono text-muted-foreground lowercase">
            no tracks found. upload some audio files to get started.
          </p>
        </motion.div>
      )}

      {playingId && (
        <AudioPlayer
          file={filtered.find((f) => f.id === playingId)!}
          onClose={() => setPlayingId(null)}
        />
      )}

      {editingId && (
        <EditAudioDialog
          file={filtered.find((f) => f.id === editingId)!}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}

