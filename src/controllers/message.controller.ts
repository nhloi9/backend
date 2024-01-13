import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'

import type { RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { prisma } from '../database/postgres'
import { messageRepo } from '../repositories'

export const createMessage = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    await prisma.$transaction(async tx => {
      const { conversationId, text, files } = req.body
      const userId = (req.payload as any).id
      const conversationMember = await tx.conversationMember.findFirst({
        where: {
          conversationId,
          userId
        }
      })
      if (conversationMember === null) {
        return res
          .status(400)
          .json(getApiResponse({ msg: 'No conversation match' }))
      }
      const message = await tx.message.create({
        data: {
          text,
          memberId: conversationMember.id,
          files: {
            create: files
          }
        },
        include: {
          files: {
            select: {
              name: true,
              id: true,
              url: true
            }
          },
          member: {
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
      await tx.conversationMember.updateMany({
        where: { conversationId },
        data: {
          isSeen: false
        }
      })
      await tx.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId
          }
        },
        data: {
          isSeen: true
        }
      })
      await tx.conversation.update({
        where: {
          id: conversationId
        },
        data: {
          lastMessage: message
        }
      })
      res.status(httpStatus.OK).json(
        getApiResponse({
          data: { message }
        })
      )
    })
  } catch (error) {
    next(error)
  }
}

export const getMessages = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversationId, limitPerPage = 100, cusor } = req.query
    // console.log(typeof limitPerPage, typeof cusor)

    const conversationMembers = await prisma.conversationMember.findMany({
      where: {
        conversationId: Number(conversationId)
      }
    })

    const messages = await messageRepo.getMessages(
      conversationMembers.map((item: any) => item.id),
      Number(limitPerPage),
      Number(cusor)
    )
    let newCusor
    if (messages.length > limitPerPage) {
      newCusor = messages.pop().id
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          messages,
          cusor: newCusor
        }
      })
    )
  } catch (error) {
    next(error)
  }
}
