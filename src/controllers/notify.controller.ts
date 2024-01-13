import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'

import type { RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { prisma } from '../database/postgres'

export const getNotifies = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifies = await prisma.notification.findMany({
      where: { receiverId: (req.payload as any).id },
      include: {
        sender: {
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
        },
        receiver: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { notifies }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const readNotify = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    await prisma.notification.update({
      where: { id: Number(id) },
      data: { isSeen: true }
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        msg: ' Read notification successfully'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const createNotify = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    // const { receivers, target, type, text, url, content } = req.body
    // await prisma.notification.createMany({
    //   data: receivers.map((receivers: number) => ({
    //     senderId
    //   }))
    // })
    res.status(httpStatus.OK).json(
      getApiResponse({
        msg: ' Read notification successfully'
      })
    )
  } catch (error) {
    next(error)
  }
}
