"use client"

import { useState, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Upload, Music, Settings, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "library", href: "/", icon: Home },
  { name: "upload", href: "/upload", icon: Upload },
  { name: "tags", href: "/tags", icon: Music },
  { name: "settings", href: "/settings", icon: Settings },
]

export const SidebarContext = createContext<{ isOpen: boolean; setIsOpen: (open: boolean) => void }>({
  isOpen: true,
  setIsOpen: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      <>
        <motion.div
          initial={false}
          animate={{
            width: isOpen ? 256 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed left-0 top-0 h-full border-r-2 border-border bg-background z-40 overflow-hidden hidden md:block"
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col p-6"
              >
                <div 
                  className="mb-8 electron-drag-region" 
                  style={{ perspective: '1000px', paddingTop: '20px' }}
                >
                  <motion.h1
                    className="font-mono text-2xl font-bold tracking-tight logo-3d"
                    animate={{
                      rotateY: 360,
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      transformStyle: 'preserve-3d',
                      display: 'inline-block',
                    }}
                  >
                    the stash
                  </motion.h1>
                </div>
                <nav className="flex-1 space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.name} href={item.href}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            className={cn(
                              "w-full justify-start font-mono lowercase",
                              isActive && "bg-foreground text-background"
                            )}
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </Button>
                        </motion.div>
                      </Link>
                    )
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.3 }}
                className="w-64 h-full border-r-2 border-border bg-background"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-full flex flex-col p-6">
                  <div 
                    className="mb-8 electron-drag-region" 
                    style={{ perspective: '1000px', paddingTop: '20px' }}
                  >
                    <motion.h1
                      className="font-mono text-2xl font-bold tracking-tight logo-3d"
                      animate={{
                        rotateY: 360,
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{
                        transformStyle: 'preserve-3d',
                        display: 'inline-block',
                      }}
                    >
                      the stash
                    </motion.h1>
                  </div>
                  <nav className="flex-1 space-y-2">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                          <motion.div
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              variant={isActive ? "default" : "ghost"}
                              className={cn(
                                "w-full justify-start font-mono",
                                isActive && "bg-foreground text-background"
                              )}
                            >
                              <item.icon className="mr-2 h-4 w-4" />
                              {item.name}
                            </Button>
                          </motion.div>
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-10 z-50 border-2 border-border bg-background p-2 font-mono hover:bg-accent transition-all duration-300"
          style={{
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
          animate={{
            left: isOpen ? 200 : 16,
          }}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>
      </>
    </SidebarContext.Provider>
  )
}
