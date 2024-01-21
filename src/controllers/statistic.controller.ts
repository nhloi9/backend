import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'

import type { RequestPayload } from '../types'
import { getApiResponse, getStartDateOfMonth } from '../utils'
import { prisma } from '../database/postgres'

export const statistic = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const statistics: any = []

    for (let i = 0; i < 12; i++) {
      const numberOfUsers = await prisma.user.count({
        where: {
          createdAt: {
            lt: i === 0 ? new Date() : getStartDateOfMonth(i - 1)
          }
        }
      })

      const numberOfPosts = await prisma.post.count({
        where: {
          createdAt: {
            lt: i === 0 ? new Date() : getStartDateOfMonth(i - 1),
            gt: getStartDateOfMonth(i)
          }
        }
      })

      const onlineUsers = await prisma.onlineUser.findUnique({
        where: {
          month_year: {
            month: getStartDateOfMonth(i).getUTCMonth() + 1,
            year: getStartDateOfMonth(i).getUTCFullYear()
          }
        }
      })
      statistics.push({
        month: getStartDateOfMonth(i).getUTCMonth() + 1,
        year: getStartDateOfMonth(i).getUTCFullYear(),
        numberOfUsers,
        numberOfOnlineUsers: onlineUsers?.numberOfOnlineUsers ?? 0,
        numberOfPosts: numberOfPosts ?? 0
      })
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { statistics }
      })
    )
  } catch (error) {
    next(error)
  }
}
