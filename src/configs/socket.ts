import { Server } from 'socket.io'
import { soketRoute } from '../routers/v1/socket.route'

const io: Server = new Server({
  /* options */
})

export const start = (): void => {
  soketRoute(io)
  io.listen(3333)
}
