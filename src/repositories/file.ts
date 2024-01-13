import { type File } from '@prisma/client'
import { prisma } from '../database/postgres'
// import { type IUser } from '../types'

const createFile = async (data: any): Promise<File> => {
  const newFile = await prisma.file.create({
    data
  })
  return newFile
}

const deleteFile = async (filter: any): Promise<any> => {
  await prisma.file.delete({
    where: filter
  })
}

// const findUser = async (filter: any): Promise<User | null> => {
//   const user = await prisma.user.findFirst({
//     where: filter
//   })
//   return user
// }

// const findUsers = async (filter: any): Promise<any[]> => {
//   const users = await prisma.user.findMany({
//     where: filter,
//     select: {
//       lastname: true,
//       firstname: true,
//       id: true,
//       avatar: true
//     }
//   })
//   return users
// }

export { createFile, deleteFile }
