import { type Response } from 'express'

import type { APIResponse } from '../types'
import { omitIsNil } from './omit'

export const getApiResponse = (
  response: any = {},
  res?: Response,
  msg?: string
): APIResponse => {
  const apiResponse: APIResponse = {
    ec: response.ec ?? 0,
    msg: msg !== undefined ? res?.__(msg) : response.msg,
    data: response.data,
    total: response.total
  }
  return omitIsNil(apiResponse)
}
