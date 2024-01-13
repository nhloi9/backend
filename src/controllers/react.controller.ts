import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'

import type { RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { prisma } from '../database/postgres'

export const importReacts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { reacts } = req.body
  await prisma.react.createMany({
    data: reacts
  })
  try {
    res.status(httpStatus.OK).json(
      getApiResponse({
        msg: 'Ok'
      })
    )
  } catch (error) {
    next(error)
  }
}
