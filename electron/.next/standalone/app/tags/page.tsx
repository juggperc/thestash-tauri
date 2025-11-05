"use client"

import { useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { useAudioStore } from "@/store/audio-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TagsPage() {
  const { files, hydrate } = useAudioStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {}
    const keyStats: Record<string, number> = {}
    const bpmStats: { min: number; max: number; avg: number } = {
      min: Infinity,
      max: -Infinity,
      avg: 0,
    }

    let bpmCount = 0
    let bpmSum = 0

    files.forEach((file) => {
      file.tags.forEach((tag) => {
        stats[tag] = (stats[tag] || 0) + 1
      })

      if (file.key) {
        keyStats[file.key] = (keyStats[file.key] || 0) + 1
      }

      if (file.bpm) {
        bpmCount++
        bpmSum += file.bpm
        bpmStats.min = Math.min(bpmStats.min, file.bpm)
        bpmStats.max = Math.max(bpmStats.max, file.bpm)
      }
    })

    bpmStats.avg = bpmCount > 0 ? Math.round(bpmSum / bpmCount) : 0

    return { tags: stats, keys: keyStats, bpm: bpmStats }
  }, [files])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-mono text-4xl font-bold mb-2 lowercase tracking-tight">tags & stats</h1>
        <p className="font-mono text-muted-foreground lowercase">
          overview of your music collection
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-mono lowercase">bpm statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono">
              <div className="flex justify-between border-b-2 border-border pb-2">
                <span className="text-muted-foreground lowercase">average:</span>
                <span className="font-bold">{tagStats.bpm.avg || "n/a"}</span>
              </div>
              <div className="flex justify-between border-b-2 border-border pb-2">
                <span className="text-muted-foreground lowercase">min:</span>
                <span className="font-bold">{tagStats.bpm.min === Infinity ? "n/a" : tagStats.bpm.min}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground lowercase">max:</span>
                <span className="font-bold">{tagStats.bpm.max === -Infinity ? "n/a" : tagStats.bpm.max}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-mono lowercase">keys</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(tagStats.keys).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(tagStats.keys)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, count]) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="border-2 border-border px-3 py-1 font-mono text-sm lowercase hover:bg-foreground hover:text-background transition-colors"
                      >
                        {key} ({count})
                      </motion.div>
                    ))}
                </div>
              ) : (
                <p className="font-mono text-muted-foreground lowercase">no keys tagged</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-mono lowercase">all tags</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(tagStats.tags).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(tagStats.tags)
                    .sort(([, a], [, b]) => b - a)
                    .map(([tag, count]) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="border-2 border-border px-3 py-1 font-mono text-sm lowercase hover:bg-foreground hover:text-background transition-colors"
                      >
                        {tag} ({count})
                      </motion.div>
                    ))}
                </div>
              ) : (
                <p className="font-mono text-muted-foreground lowercase">no tags</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

