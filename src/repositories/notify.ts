import { io } from '../configs/express'
import { prisma } from '../database/postgres'

const createNotify = async ({
  notifyData,
  senderId,
  receiverId
}: any): Promise<any> => {
  const notify = await prisma.notification.create({
    data: {
      receiverId,
      senderId,
      ...notifyData
    },
    include: {
      sender: {
        select: {
          firstname: true,
          lastname: true,
          id: true,
          avatar: {
            select: {
              id: true,
              name: true,
              url: true
            }
          }
        }
      },
      receiver: {
        select: {
          firstname: true,
          lastname: true,
          id: true,
          avatar: {
            select: {
              id: true,
              name: true,
              url: true
            }
          }
        }
      }
    }
  })
  io.to(`user_${receiverId as string}`).emit('notify', notify)
  return notify
}

export { createNotify }
