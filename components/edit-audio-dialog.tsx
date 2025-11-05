"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAudioStore } from "@/store/audio-store"
import { AudioFile } from "@/store/audio-store"

const MUSIC_KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
]

interface EditAudioDialogProps {
  file: AudioFile
  onClose: () => void
}

export function EditAudioDialog({ file, onClose }: EditAudioDialogProps) {
  const { updateFile } = useAudioStore()
  const [key, setKey] = useState(file.key || "")
  const [bpm, setBpm] = useState(file.bpm?.toString() || "")
  const [tags, setTags] = useState(file.tags.join(", "))

  const handleSave = async () => {
    await updateFile(file.id, {
      key: key || undefined,
      bpm: bpm ? parseInt(bpm) : undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono lowercase">edit track</CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono lowercase">key</Label>
                <Select value={key} onChange={(e) => setKey(e.target.value)}>
                  <option value="">none</option>
                  {MUSIC_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-mono lowercase">bpm</Label>
                  <a
                    href="https://tunebat.com/Analyzer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors lowercase"
                  >
                    detect bpm
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  type="number"
                  placeholder="bpm"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono lowercase">tags (comma-separated)</Label>
                <Input
                  placeholder="tag1, tag2, tag3"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 font-mono lowercase"
                >
                  cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 font-mono lowercase"
                >
                  save
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

