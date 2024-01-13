// eslint-disable-next-line import/no-cycle
import { emitter } from '../configs'
import { events } from '../constants'
import { connectDb } from './postgres'

const connect = (): void => {
  emitter.on(events.POSTGRES_CONNECTED, (uri: string) => {
    console.info(`[database]-[postgres] connected ${uri}`)
    emitter.emit(events.DB_CONNECTED)
  })
  connectDb()
}

export default { connect }
