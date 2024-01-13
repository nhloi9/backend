import { type FriendRequest } from '@prisma/client'
import { prisma } from '../database/postgres'
import { on } from 'events'
// import { type IUser } from '../types'

const createFriendRequest = async (
  senderId: number,
  receiverId: number
): Promise<FriendRequest> => {
  const newFriendRequest = await prisma.friendRequest.create({
    data: {
      receiverId,
      senderId
    },
    include: {
      sender: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: true
        }
      },
      receiver: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: true
        }
      }
    }
  })
  return newFriendRequest
}

const findFriendRequest = async (
  senderId: number,
  receiverId: number
): Promise<FriendRequest[]> => {
  const friendRequest = await prisma.friendRequest.findMany({
    where: {
      OR: [
        {
          senderId,
          receiverId
        },
        {
          senderId: receiverId,
          receiverId: senderId
        }
      ]
    }
  })
  return friendRequest
}

const deleteFriendRequest = async (requestId: number): Promise<any> => {
  return await prisma.friendRequest.delete({
    where: {
      id: requestId
    }
  })
}
const updateFriendRequest = async (requestId: number): Promise<any> => {
  return await prisma.friendRequest.update({
    where: {
      id: requestId
    },
    data: {
      status: 'accepted'
    }
  })
}

export {
  createFriendRequest,
  updateFriendRequest,
  findFriendRequest,
  deleteFriendRequest
}

export const findAllFriends = async (userId: number): Promise<any[]> => {
  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        {
          senderId: userId
        },
        {
          receiverId: userId
        }
      ],
      status: 'accepted'
    },
    include: {
      sender: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: true
        }
      },
      receiver: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: true
        }
      }
    }
  })
  return requests.map((req: any) =>
    req?.senderId === userId ? req?.receiver : req?.sender
  )
}

// export const findSendRequests = async (senderId: number): Promise<any> => {
//   return await prisma.friendRequest.findMany({
//     where: {
//       senderId,
//       status: 'waiting'
//     },
//     include: {
//       receiver: {
//         select: {
//           lastname: true,
//           firstname: true,
//           id: true,
//           avatar: true
//         }
//       }
//     }
//   })
// }

// export const findReceiveRequests = async (receiverId: number): Promise<any> => {
//   return await prisma.friendRequest.findMany({
//     where: {
//       receiverId,
//       status: 'waiting'
//     },
//     include: {
//       sender: {
//         select: {
//           lastname: true,
//           firstname: true,
//           id: true,
//           avatar: true
//         }
//       }
//     }
//   })
// }

export const findAllRequests = async (userId: number): Promise<any> => {
  return await prisma.friendRequest.findMany({
    where: {
      OR: [
        {
          senderId: userId
        },
        {
          receiverId: userId
        }
      ]
    },
    include: {
      sender: {
        select: {
          lastname: true,
          firstname: true,
          id: true,
          avatar: true
        }
      },
      receiver: {
        select: {
          lastname: true,
          firstname: true,
          id: true,
          avatar: true
        }
      }
    }
  })
}

export const checkIsFriend = async (
  one: number,
  second: number
): Promise<boolean> => {
  const request = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        {
          senderId: one,
          receiverId: second
        },
        {
          senderId: second,
          receiverId: one
        }
      ],
      status: 'accepted'
    }
  })
  if (request !== null) {
    return true
  } else return false
}
