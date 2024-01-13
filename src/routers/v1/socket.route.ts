import type { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

import { prisma } from '../../database/postgres'
import { socketTokenSettings, tokenSettings } from '../../configs'
import { number } from 'joi'
import { io } from '../../configs/express'

const change: any = {}

let onlineUsers: number[] = []
const users: any = {}
const calls: any = {}
const socketToCall: any = {}

// const checkBusyCall = (io: any, userId: number): boolean => {
//   return (
//     io?.sockets?.adapter?.rooms?.get('user_' + userId.toString())?.call !==
//     undefined
//   )
// }

export const soketRoute = (io: Server): void => {
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (token === undefined) {
        throw new Error()
      }
      const payload = jwt.verify(token, socketTokenSettings.secret)
      const user = await prisma.user.findUnique({
        where: { id: (payload as any).id }
      })
      if (user === null) {
        throw new Error()
      }
      socket.join('user_' + user.id?.toString())
      socket.userId = user.id
      next()
    } catch (error) {
      next(new Error('unAuthorization'))
    }
  })

  io.on('connection', (socket: any) => {
    if (!onlineUsers.includes(socket?.userId)) {
      onlineUsers.push(socket?.userId)
      socket.broadcast.emit('online', socket?.userId)
    }

    if (users[socket.userId] !== undefined) {
      users[socket.userId].push(socket.id)
    } else users[socket.userId] = [socket.id]

    // const ip = socket.handshake.headers['x-forwarded-for']
    // socket.conn.remoteAddress.split(':')[3]
    // console.log(ip)
    // console.log(socket.request.connection.remoteAddress)
    // console.log(socket.handshake, socket.handshake.address.port)
    console.log('connection', socket.id)
    console.log({ users })
    socket.emit('onlineUsers', onlineUsers)
    socket.on('test', (params: any) => {
      console.log(params)
    })

    socket.on('addMessage', async ({ message }: any) => {
      try {
        const memberRooms = await getUserRoomsOfConversation(
          message?.member?.conversationId
        )
        socket.to(memberRooms).emit('addMessage', { message })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('seenConversation', async ({ conversationId }: any) => {
      try {
        const memberRooms = await getUserRoomsOfConversation(conversationId)
        console.log(memberRooms)
        socket
          .to(memberRooms)
          .emit('seenConversation', { userId: socket.userId, conversationId })
      } catch (error) {}
    })

    socket.on('addFriendRequest', (request: any) => {
      socket
        .to([
          `user_${request?.senderId as string}`,
          `user_${request?.receiverId as string}`
        ])
        .emit('addFriendRequest', request)
    })

    socket.on('updateFriendRequest', (request: any) => {
      socket
        .to([
          `user_${request?.senderId as string}`,
          `user_${request?.receiverId as string}`
        ])
        .emit('updateFriendRequest', request?.id)
    })

    socket.on('deleteFriendRequest', (request: any) => {
      socket
        .to([
          `user_${request?.senderId as string}`,
          `user_${request?.receiverId as string}`
        ])
        .emit('deleteFriendRequest', request?.id)
    })

    // calll
    socket.on('call', async (payload: any) => {
      const { conversation }: any = payload
      if (checkBusy(socket.userId)) {
        socket.emit('meBusy')
        return
      }
      const otherOnlineMemberIds = (
        await prisma.conversationMember.findMany({
          where: {
            conversationId: Number(conversation?.id)
          }
        })
      )
        .map((member: any) => member?.userId)
        .filter(
          (item: number) => item !== socket?.userId && users[item] !== undefined
        )

      if (otherOnlineMemberIds?.length === 0) {
        socket.emit('otherOffline')
        return
      } else if (
        otherOnlineMemberIds?.every((memberId: number) => checkBusy(memberId))
      ) {
        socket.emit('otherBusy')
        return
      }
      calls[conversation.id] = [socket.id]
      socketToCall[socket.id] = conversation.id
      for (const id of otherOnlineMemberIds) {
        if (!checkBusy(id)) {
          // socketToCall[

          // ]
          socket.to('user_' + (id as string)).emit('call', payload)
        }
      }
    })

    socket.on('joinRoom', (conversationId: number) => {
      console.log({ conversationId })
      if (calls[conversationId] !== undefined) {
        const length = calls[conversationId].length
        if (length === 4) {
          socket.emit('roomFull')
          return
        }
        socketToCall[socket.id] = conversationId
        calls[conversationId].push(socket.id)
        const socketsInThisRoom = calls[conversationId].filter(
          (id: string) => id !== socket.id
        )

        console.log({ calls, socketId: socket.id, socketsInThisRoom })
        socket.emit('allUsers', socketsInThisRoom)
      } else {
        // users[roomID] = [socket.id]
      }
      // userToCall[socket.userId] = conversationId
    })

    socket.on('leftCall', (roomId: number) => {
      if (calls[roomId] !== undefined) {
        calls[roomId] = calls[roomId].filter(
          (item: string) => item !== socket.id
        )
        if (calls[roomId].length === 0) {
          calls[roomId] = undefined
        }
      }
      if (calls[roomId] === undefined) {
        io.emit('endCall', roomId)
      } else {
        socket.broadcast.emit('leftCall', roomId, socket.id)
      }
      if (socketToCall[socket.id] !== undefined) {
        socketToCall[socket.id] = undefined
      }
    })
    socket.on('getUserFromPeerId', (peerId: string) => {
      const userId = Object.keys(users)?.find(item =>
        users[item]?.includes(peerId)
      )
      console.log({ userId })
      if (userId !== undefined) {
        socket.emit('getUserFromPeerId', { userId, peerId })
      }
    })

    // change audio or video flag
    socket.on('change', (payload: any) => {
      change[socket.id] = payload
      io.emit('getChange', change)
    })
    socket.on('leave', () => {
      change[socket.id] = undefined
      io.emit('getChange', change)
      console.log('leave')
    })
    socket.on('getChange', () => {
      socket.emit('getChange', change)
    })

    socket.on('disconnect', (resonse: any) => {
      console.log('disconnect', socket.id)

      if (users[socket.userId] !== undefined) {
        users[socket.userId] = users[socket.userId].filter(
          (item: string) => item !== socket.id
        )
        if (users[socket.userId].length === 0) {
          users[socket.userId] = undefined
        }
      }
      const roomID = socketToCall[socket.id]
      if (roomID !== undefined) {
        let room = calls[roomID]
        if (room !== undefined) {
          room =
            room.filter((id: string) => id !== socket.id)?.length === 0
              ? undefined
              : room.filter((id: string) => id !== socket.id)

          if (room === undefined) {
            socket.broadcast.emit('endCall', roomID)
          } else {
            socket.broadcast.emit('leftCall', roomID, socket.id)
          }
          calls[roomID] = room
        }
        socketToCall[socket.id] = undefined
      }

      if (
        io.sockets.adapter.rooms.get('user_' + (socket?.userId as string)) ===
        undefined
      ) {
        onlineUsers = onlineUsers.filter((id: number) => id !== socket?.userId)
        socket.broadcast.emit('offline', socket?.userId)
      }
    })
  })
}

const getUserRoomsOfConversation = async (
  conversationId: any
): Promise<any[]> => {
  const members = await prisma.conversationMember.findMany({
    where: {
      conversationId: Number(conversationId)
    }
  })
  const userIds = members.map(member => 'user_' + member.userId?.toString())
  return userIds
}

function checkBusy (userId: any): boolean {
  if (users[userId] !== undefined) {
    for (const socketId of users[userId]) {
      if (socketToCall[socketId] !== undefined) {
        return true
      }
    }
  }
  return false
}
