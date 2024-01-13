import { prisma } from '../database/postgres'

const getMessages = async (
  conversationMembers: number[],
  limitPerPage: number,
  idCusor?: any
): Promise<any> => {
  const messages = await prisma.message.findMany({
    take: limitPerPage + 1,
    ...(isNaN(idCusor) ? {} : { cursor: { id: idCusor } }),
    where: {
      memberId: { in: conversationMembers }
    },
    orderBy: {
      id: 'desc'
    },
    include: {
      files: {
        select: {
          name: true,
          id: true,
          url: true
        }
      },
      member: {
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              avatar: {
                select: {
                  id: true,
                  name: true,
                  url: true
                }
              }
            }
          }
        }
      }
    }
  })
  return messages
}
export { getMessages }
