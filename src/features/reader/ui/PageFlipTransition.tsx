"use client"

import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"

interface PageFlipTransitionProps {
  children: ReactNode
}

export function PageFlipTransition({ children }: PageFlipTransitionProps) {
  const pathname = usePathname()

  return (
    <div style={{ perspective: 1200 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
