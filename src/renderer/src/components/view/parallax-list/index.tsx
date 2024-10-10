'use client'

import React, { useRef, useEffect, useState } from 'react'

const items = Array.from({ length: 20 }, (_, i) => i + 1)

export default function ParallaxList() {
  const listDivRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
        setOffset(listDivRef.current?.scrollTop ?? 0)
    }
    listDivRef.current?.addEventListener('scroll', handleScroll)
    return () => {
        listDivRef.current?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="w-full max-w-md mx-auto h-[500px] overflow-y-auto bg-gray-100" ref={listDivRef}>
      {items.map((item) => (
        <div
          key={item}
          className="h-40 bg-white rounded-lg shadow-md flex items-center justify-center text-2xl font-bold relative"
          style={{
            transform: `translateY(${Math.max(0, offset - (item - 1) * 160)}px)`,
          }}
        >
          Item {item}
        </div>
      ))}
    </div>
  )
}