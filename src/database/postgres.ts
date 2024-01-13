import { PrismaClient } from '@prisma/client'
import { events } from '../constants'
import { emitter } from '../configs'

const prisma = new PrismaClient()
// .$extends({
//   result: {
//     user: {
//       fullname: {
//         needs: { firstname: true, lastname: true },
//         compute (user) {
//           return `${user.firstname} ${user.lastname}`
//         }
//       }
//     }
//   }
// })

// async function excludePasswordMiddleware (params: any, next: any): Promise<any> {
//   const result = await next(params)
//   if (params?.model === 'User' && params?.args?.select?.password !== true) {
//     delete result?.password
//   }
//   return result
// }
// prisma.$use(excludePasswordMiddleware)

// async function updateUserFullName (user: any): void {
//   user.fullName = `${user.firstName} ${user.lastName}`
// }

// prisma.$on('beforeSave', async model => {
//   if (model instanceof prisma.user) {
//     await updateUserFullName(model)
//   }
// })

const connectDb = (): void => {
  emitter.emit(events.POSTGRES_CONNECTED, process.env.DATABASE_URL)
}

export { prisma, connectDb }
