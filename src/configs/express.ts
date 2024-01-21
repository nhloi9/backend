import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import timeout from 'connect-timeout'
import methodOverride from 'method-override'
import morgan from 'morgan'
import { I18n } from 'i18n'
import path from 'path'
import cookieParser from 'cookie-parser'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PeerServer } from 'peer'
import schedule from 'node-schedule'

import { emitter } from './event-emitter'
import { vars } from './vars'
import { events } from '../constants'
import database from '../database'
import routerV1 from '../routers/v1'
import { notFound, errorConverter } from '../middlewares'
import { soketRoute } from '../routers/v1/socket.route'
import { prisma } from '../database/postgres'
import { getStartDateOfMonth } from '../utils'

const app: Express = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  /* options */
  cors: {
    origin: [process.env.CLIENT_URL as string],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

PeerServer({ port: 9000, path: '/' })

const i18n = new I18n()

i18n.configure({
  locales: ['en', 'vi'],
  directory: path.join(__dirname, '../constants/locales'),
  defaultLocale: 'en'
})

const initApp = (app: express.Express, io: Server): void => {
  soketRoute(io)

  const rule = new schedule.RecurrenceRule()
  rule.hour = 12
  rule.minute = 12
  rule.tz = 'Etc/UTC'
  schedule.scheduleJob(rule, async () => {
    console.log('lddlld')
    try {
      const numberOfOnlineUsers = await prisma.user.count({
        where: {
          lastOnline: {
            gte: getStartDateOfMonth(0)
          }
        }
      })

      await prisma.onlineUser.upsert({
        where: {
          month_year: {
            month: new Date().getUTCMonth() + 1,
            year: new Date().getUTCFullYear()
          }
        },
        update: {
          numberOfOnlineUsers
        },
        create: {
          month: new Date().getUTCMonth() + 1,
          year: new Date().getUTCFullYear(),
          numberOfOnlineUsers
        }
      })
    } catch (error) {
      console.log(error)
    }
  })
  app.use(timeout('50s'))
  app.use(morgan('dev'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(methodOverride())
  app.use(helmet())
  app.use(
    cors({
      credentials: true,
      origin: process.env.CLIENT_URL
    })
  )
  app.use(cookieParser())
  app.use(i18n.init)

  app.get('/health', (_req: Request, res: Response) => {
    // console.log(_req.headers['accept-language'])
    // res.send('OK')
    res.send(res.__('hello'))
  })

  app.use('/', routerV1)
  app.use(notFound)
  // app.use(haltOnTimedout)

  app.use(errorConverter)
}

export const start = (): void => {
  emitter.on(events.DB_CONNECTED, () => {
    initApp(app, io)
    httpServer.listen(vars.port, () => {
      console.info(`[server] listen on port ${vars.port}`)
    })
  })
  database.connect()
}

export { io }
