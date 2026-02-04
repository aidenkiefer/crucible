'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001', {
        transports: ['websocket'],
      })

      socket.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })
    }

    return () => {
      if (socket) {
        socket.off('connect')
        socket.off('disconnect')
      }
    }
  }, [])

  return socket
}
