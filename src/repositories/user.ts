import { prisma } from '../database/postgres'
// import { type IUser } from '../types'

const createUser = async ({ userData, avatar }: any): Promise<any> => {
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      fullname: (
        (userData.firstname as string) +
        ' ' +
        (userData.lastname as string)
      )
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase(),
      ...(avatar !== undefined && {
        avatar: {
          create: avatar
        }
      })
    }
  })
  return newUser
}

const findUser = async (filter: any): Promise<any> => {
  const user = await prisma.user.findFirst({
    where: filter,
    include: {
      avatar: true,
      detail: {
        include: {
          coverImage: true
        }
      }
    }
  })

  return user
}

const findUsers = async (filter: any): Promise<any[]> => {
  const users = await prisma.user.findMany({
    where: filter,
    select: {
      lastname: true,
      firstname: true,
      id: true,
      avatar: true,
      detail: {
        include: {
          coverImage: true
        }
      }
    }
  })
  return users
}

const updateAvatar = async (userId: number, avatar: any): Promise<any> => {
  return await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      avatar: {
        delete: {},
        create: avatar
      }
    }
  })
}

const updateProfile = async (userId: number, data: any): Promise<any> => {
  const { firstname, lastname, ...detail } = data
  await prisma.user.update({
    where: { id: userId },
    data: {
      firstname,
      lastname,
      fullname: ((firstname as string) + ' ' + (lastname as string))
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    }
  })

  if (Object.keys(detail).length !== 0) {
    await prisma.userDetail.upsert({
      where: {
        userId
      },
      update: {
        ...detail,
        ...(detail.birthday !== undefined
          ? detail.birthday === null
            ? { birthday: null }
            : { birthday: new Date(detail.birthday) }
          : {})
      },
      create: {
        userId,
        ...detail,
        ...(detail.birthday !== undefined
          ? detail.birthday === null
            ? { birthday: null }
            : { birthday: new Date(detail.birthday) }
          : {})
        // ...(birthday !== undefined ? { birthday: new Date() } : {})
      }
    })
  }
}

export { createUser, findUser, findUsers, updateAvatar, updateProfile }
