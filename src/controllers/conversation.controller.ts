import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'

import type { RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { prisma } from '../database/postgres'
import { Prisma } from '@prisma/client'

export const createConversation = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { members, name } = req.body
  const userId = (req.payload as any).id
  try {
    let conversation: any
    if (members.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          members: {
            every: {
              userId: {
                in: [userId, members[0]]
              }
            }
          }
        }
      })
      if (existingConversation === null) {
        conversation = await prisma.conversation.create({
          data: {
            members: {
              createMany: {
                data: [
                  {
                    userId,
                    isAdmin: true
                  },
                  { userId: members[0] }
                ]
              }
            }
          }
        })
      } else conversation = existingConversation
    } else {
      const membersData = members.map((member: number) => ({
        userId: member
      }))
      conversation = await prisma.conversation.create({
        data: {
          name,
          isGroup: true,
          members: {
            createMany: {
              data: [
                {
                  userId,
                  isAdmin: true
                },
                ...membersData
              ]
            }
          }
        }
      })
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { conversation }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const seenConversation = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const userId = (req.payload as any).id
  try {
    // await prisma.conversation.update({
    //   where: {
    //     id: Number(req.params.id)
    //   },
    //   data: {
    //     members: {
    //       update: {
    //         where: {
    //           conversationId_userId: {
    //             conversationId: Number(req.params.id),
    //             userId
    //           }
    //         },
    //         data: {
    //           isSeen: true
    //         }
    //       }
    //     }
    //   }
    // })
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId: Number(req.params.id),
          userId
        }
      },
      data: {
        isSeen: true
      }
    })

    res.status(httpStatus.OK).json(
      getApiResponse({
        msg: 'Seen conversation success'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getAllConversation = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: (req.payload as any).id
          }
        },
        lastMessage: {
          not: Prisma.DbNull
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
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
        }
      }
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          conversations
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getConversation = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
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
        }
      }
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          conversation
        }
      })
    )
  } catch (error) {
    next(error)
  }
}
