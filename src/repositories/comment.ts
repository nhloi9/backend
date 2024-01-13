import { prisma } from '../database/postgres'

const createComment = async (data: any): Promise<any> => {
  const comment = await prisma.comment.create({
    data,
    include: {
      sender: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: {
            select: { name: true, url: true }
          }
        }
      },
      receiver: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: {
            select: { name: true, url: true }
          }
        }
      },
      answers: true,
      reacts: {
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              avatar: true
            }
          }
        }
      }
    }
  })
  return comment
}

const getComments = async (
  postId: number,
  limitPerPage: number,
  idCusor?: any
): Promise<any> => {
  console.log({ postId, limitPerPage, idCusor })
  const comments = await prisma.comment.findMany({
    take: limitPerPage + 1,
    ...(isNaN(idCusor) ? {} : { cursor: { id: idCusor } }),
    where: {
      postId,
      parentId: null
    },
    orderBy: {
      id: 'desc'
    },
    include: {
      sender: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: {
            select: { name: true, url: true }
          }
        }
      },
      receiver: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: {
            select: { name: true, url: true }
          }
        }
      },
      answers: {
        include: {
          sender: {
            select: {
              firstname: true,
              lastname: true,
              avatar: {
                select: { name: true, url: true }
              },
              id: true
            }
          },
          receiver: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              avatar: {
                select: { name: true, url: true }
              }
            }
          }
        }
      },
      reacts: {
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              avatar: true
            }
          }
        }
      }
    }
  })
  return comments
}
export { createComment, getComments }
