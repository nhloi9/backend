import jwt, { TokenExpiredError } from 'jsonwebtoken'
import httpStatus from 'http-status'
import { type Response } from 'express'

import { tokenSettings } from '../configs'
import { type RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { messages } from '../constants'
import { prisma } from '../database/postgres'

export const verifyToken = async (
  req: RequestPayload,
  res: Response,
  next: any
) => {
  try {
    const { token } = req.cookies
    if (token === undefined) {
      throw new Error()
    }
    const payload = jwt.verify(token, tokenSettings.secret)
    const user = await prisma.user.findUnique({
      where: { id: (payload as any).id }
    })
    if (user === null) {
      throw new Error()
    }
    req.payload = user
    // console.log('[verify-token]', payload)
    next()
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(getApiResponse(messages.ACCESS_TOKEN_EXPIRED))
    }
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json(getApiResponse(messages.ACCESS_TOKEN_INVALID))
  }
}
