import type { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

import { prisma } from '../../database/postgres'
import { socketTokenSettings } from '../../configs'

const change: any = {}

let onlineUsers: number[] = []

// contain userId and array of socketId
const users: any = {}

// contain conversationId and array of socketId
const calls: any = {}

// contain socketId and conversationId
const socketToCall: any = {}

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
    console.log('connection', socket.id)

    // update last online of user
    void prisma.user
      .update({
        where: {
          id: socket.userId
        },
        data: {
          lastOnline: new Date()
        }
      })
      .catch(error => {
        console.log(error)
      })

    // update array online users
    if (!onlineUsers.includes(socket?.userId)) {
      onlineUsers.push(socket?.userId)
      socket.broadcast.emit('online', socket?.userId)
    }

    // update user and list socket of user
    if (users[socket.userId] !== undefined) {
      users[socket.userId].push(socket.id)
    } else users[socket.userId] = [socket.id]
    socket.emit('onlineUsers', onlineUsers)
    console.log({ users })

    //  join posts
    socket.on('joinPosts', (postIds: any) => {
      const currentRooms = socket.rooms
      currentRooms.forEach((roomName: string) => {
        if (roomName.includes('post_')) {
          socket.leave(roomName)
        }
      })
      const rooms = postIds.map((postId: any) => 'post_' + (postId as string))
      socket.join(rooms)
      // console.log(rooms)
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

    socket.on('updatePost', (post: any) => {
      socket.to('post_' + (post.id as string)).emit('updatePost', post)
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
        if (length >= 4) {
          socket.emit('roomFull')
          return
        }
        if (checkBusy(socket.userId)) {
          socket.emit('meBusy')
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

      void prisma.user
        .update({
          where: {
            id: socket.userId
          },
          data: {
            lastOnline: new Date()
          }
        })
        .catch(error => {
          console.log(error)
        })
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
