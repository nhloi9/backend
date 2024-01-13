import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

import { envs } from '../constants'

dotenv.config()

const env = process.env.ENV ?? envs.DEV

export const vars = {
  port: process.env.PORT ?? 3333,
  env,
  postgres: {
    servers: process.env.POSTGRES_SERVER ?? 'localhost:27017',
    dbName:
      env === envs.TEST
        ? process.env.MONGO_PG_NAME_TEST ?? 'db-test'
        : process.env.MONGO_PB_NAME ?? 'social',
    username: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    repls: process.env.POSTGRES_REPLS
  }
}

export const socketTokenSettings = {
  secret: process.env.SOCKET_TOKEN_SECRET ?? 'secret_2',
  expireTime: !isNaN(Number(process.env.SOCKET_TOKEN_EXP))
    ? Number(process.env.SOCKET_TOKEN_EXP)
    : 2 * 24 * 3600 // seconds
}
export const tokenSettings = {
  secret: process.env.TOKEN_SECRET ?? 'secret_1',
  expireTime:
    process.env.TOKEN_EXP !== undefined
      ? Number(process.env.TOKEN_EXP)
      : 6000000 // seconds
}

export const refreshTokenSettings = {
  secret: process.env.REFRESH_TOKEN_SECRET ?? 'secret_2',
  expireTime: Number(process.env.REFRESH_TOKEN_EXP) ?? 6000000 //
}

export const oauth2Settings = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  redirectUrl: process.env.REDIRECT_URL,
  clientUrl: process.env.CLIENT_URL
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMPT_MAIL,
    pass: process.env.SMPT_PASSWORD
  }
})
