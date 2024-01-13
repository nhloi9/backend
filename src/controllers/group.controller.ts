import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'

import { groupRepo, notifyRepo, postRepo } from '../repositories'
import type { RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { prisma } from '../database/postgres'
import { checkIsAdmin, checkIsMember } from '../repositories/group'
import { get } from 'lodash'

export const createGroup = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { name, privacy, invites } = req.body
  try {
    const existingGroup = await prisma.group.findMany({
      where: { name }
    })
    if (existingGroup?.length > 0) {
      return res.status(400).json({
        msg: 'Group name already exists'
      })
    }
    const group = await groupRepo.createGroup(
      name,
      privacy,
      (req.payload as any).id,
      invites
    )

    const invitesPromise = invites.map(async (userId: number): Promise<any> => {
      return await notifyRepo.createNotify({
        notifyData: {
          text: 'invite you join group',
          url: `http://localhost:3000/groups/${group?.id as string}`,
          type: 'iviteGroup',
          target: {
            name: group.name,
            image: group.image?.url
          }
        },
        senderId: (req.payload as any).id,
        receiverId: userId
      })
    })
    await Promise.all(invitesPromise)
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { group }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getGroup = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  try {
    const group: any = await groupRepo.getGroup(Number(id))
    if (group === null) {
      return res.status(httpStatus.NOT_FOUND).json({ msg: 'Group not found' })
    }

    // const membersId = (
    //   await prisma.groupReqest.findMany({
    //     where: {
    //       groupId: group.id,
    //       status: 'accepted'
    //     }
    //   })
    // ).map((item: any) => item.userId)
    // const members = await prisma.user.findMany({
    //   where: {
    //     id: { in: [...membersId, group.adminId] }
    //   },
    //   select: {
    //     lastname: true,
    //     firstname: true,
    //     id: true,
    //     avatar: {
    //       select: {
    //         id: true,
    //         name: true,
    //         url: true
    //       }
    //     }
    //   }
    // })
    // group.members = members
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { group }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const createManyRequests = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const {
    groupId,
    invites
  }: {
    groupId: number
    invites: number[]
  } = req.body
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        image: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    })
    if (group === null) {
      return res.status(400).json(getApiResponse({ msg: 'Group not found' }))
    }

    if (group.adminId === (req.payload as any).id) {
      await prisma.group.update({
        where: {
          id: groupId,
          adminId: (req.payload as any).id
        },
        data: {
          requests: {
            connectOrCreate: invites.map((userId: number) => ({
              where: {
                userId_groupId: {
                  groupId,
                  userId
                }
              },
              create: {
                userId,
                type: 'invite',
                status: 'waiting'
              }
            }))
          }
        }
      })
    }

    const invitesPromise = invites.map(async (userId: number): Promise<any> => {
      return await notifyRepo.createNotify({
        notifyData: {
          text: 'invite you join group',
          url: `http://localhost:3000/groups/${groupId}`,
          type: 'inviteGroup',
          target: {
            name: group.name,
            image: group.image?.url
          }
        },
        senderId: (req.payload as any).id,
        receiverId: userId
      })
    })
    await Promise.all(invitesPromise)
    res.status(200).json(getApiResponse({ msg: 'invite success' }))
  } catch (error) {
    next(error)
  }
}

export const updateRequest = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestId = Number(req.params.id)
    const userId = (req.payload as any).id
    const request = await prisma.groupReqest.findUnique({
      where: {
        id: requestId
      },
      include: {
        group: true
      }
    })
    if (request === null) {
      return res.status(400).json({ msg: 'Request not found' })
    }
    if (
      (request?.type === 'invite' && request?.userId === userId) ||
      (request?.type === 'join' && request?.group?.adminId === userId)
    ) {
      await prisma.groupReqest.update({
        where: { id: requestId },
        data: {
          status: 'accepted'
        }
      })
      return res.status(200).json(getApiResponse({ msg: 'Accepted success' }))
    }
    res
      .status(400)
      .json({ msg: 'You do not have permission to accept this request' })
  } catch (error) {
    next(error)
  }
}

// delete request
export const deleteRequest = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const requestId = Number(req.params.id)
  try {
    const userId = (req.payload as any).id
    const request = await prisma.groupReqest.findUnique({
      where: {
        id: requestId
      },
      include: {
        group: true
      }
    })
    if (request === null) {
      return res.status(404).json(getApiResponse({ msg: 'Request not found' }))
    }

    if (request.group.adminId === userId || request.userId === userId) {
      await prisma.groupReqest.delete({
        where: { id: requestId }
      })
      res.status(200).json(getApiResponse({ msg: 'Cancel request success' }))
    } else {
      res
        .status(400)
        .json(
          getApiResponse({ msg: 'You are not allowed to delete this request' })
        )
    }

    // const invitesPromise = invites.map(async (userId: number): Promise<any> => {
    //   return await notifyRepo.createNotify({
    //     notifyData: {
    //       text: 'invite you join group',
    //       url: `http://localhost:3000/groups/${groupId}`,
    //       type: 'iviteGroup',
    //       target: {
    //         name: group.name,
    //         image: group.image?.url
    //       }
    //     },
    //     senderId: (req.payload as any).id,
    //     receiverId: userId
    //   })
    // })
    // await Promise.all(invitesPromise)
  } catch (error) {
    next(error)
  }
}

export const createSingleRequest = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const {
    groupId
  }: {
    groupId: number
  } = req.body
  try {
    const request = await prisma.groupReqest.create({
      data: {
        groupId,
        userId: (req.payload as any).id,
        status: 'waiting',
        type: 'join'
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            avatar: {
              select: {
                id: true,
                url: true,
                name: true
              }
            }
          }
        },
        group: {
          include: {
            image: {
              select: {
                url: true,
                name: true,
                id: true
              }
            }
          }
        }
      }
    })

    // const invitesPromise = invites.map(async (userId: number): Promise<any> => {
    //   return await notifyRepo.createNotify({
    //     notifyData: {
    //       text: 'invite you join group',
    //       url: `http://localhost:3000/groups/${groupId}`,
    //       type: 'iviteGroup',
    //       target: {
    //         name: group.name,
    //         image: group.image?.url
    //       }
    //     },
    //     senderId: (req.payload as any).id,
    //     receiverId: userId
    //   })
    // })
    // await Promise.all(invitesPromise)
    res.status(200).json(getApiResponse({ data: { request } }))
  } catch (error) {
    next(error)
  }
}

export const getAllRequestsOfUser = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const requests = await prisma.groupReqest.findMany({
      where: {
        userId: (req.payload as any).id
      },
      include: {
        group: {
          include: {
            image: {
              select: {
                url: true
              }
            }
          }
        }
      }
    })

    res.status(200).json(getApiResponse({ data: { requests } }))
  } catch (error) {
    next(error)
  }
}

export const getOwnGroups = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        adminId: (req.payload as any).id
      },
      include: {
        image: {
          select: {
            url: true
          }
        }
      }
    })

    res.status(200).json(getApiResponse({ data: { groups } }))
  } catch (error) {
    next(error)
  }
}

export const getPendingPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id
    const groupId = Number(req.params.id)

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
        adminId: (req.payload as any).id
      }
    })
    if (group === null) {
      return res.status(200).json(
        getApiResponse({
          data: {
            posts: []
          }
        })
      )
    }
    const posts: any = await prisma.post.findMany({
      where: {
        groupId,
        accepted: false
      },
      include: {
        shareBys: {
          select: {
            createdAt: true,

            id: true,
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                avatar: true
              }
            }
          }
        },
        files: true,
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            avatar: true
          }
        },
        reacts: {
          include: {
            react: true,
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                avatar: true
              }
            }
          }
        },
        comments: {
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
          },

          orderBy: {
            createdAt: 'desc'
          }
        },
        tags: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            avatar: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            privacy: true,
            image: true,
            adminId: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    for (const post of posts) {
      if (post?.shareId !== null) {
        const share = await postRepo.getSinglePost(userId, post.shareId)
        post.share = share
      }
    }

    res.status(200).json(getApiResponse({ data: { posts } }))
  } catch (error) {
    res.status(200).json(getApiResponse({ data: { posts: [] } }))
  }
}

export const approvePosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const groupId = Number(req.params.id)
    const { postIds } = req.body

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
        adminId: (req.payload as any).id
      }
    })
    if (group === null) {
      return res.status(400).json(
        getApiResponse({
          msg: 'You do not have permission to access this group'
        })
      )
    }

    await prisma.post.updateMany({
      where: {
        id: {
          in: postIds
        }
      },
      data: {
        accepted: true
      }
    })

    res.status(200).json(getApiResponse({ msg: 'Approve posts successfully' }))
  } catch (error) {
    next(error)
  }
}

export const declinePosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const groupId = Number(req.params.id)
    const { postIds } = req.body

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
        adminId: (req.payload as any).id
      }
    })
    if (group === null) {
      return res.status(400).json(
        getApiResponse({
          msg: 'You do not have permission to access this group'
        })
      )
    }

    await prisma.post.deleteMany({
      where: {
        id: {
          in: postIds
        },
        accepted: false
      }
    })

    res.status(200).json(getApiResponse({ msg: 'Decline posts successfully' }))
  } catch (error) {
    next(error)
  }
}

export const getAllFilesOfGroup = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const groupId = Number(req.params.id)
    const userId = (req.payload as any).id

    const group = await prisma.group.findUnique({
      where: {
        id: groupId
      }
    })
    if (group === null) {
      return res.status(400).json(getApiResponse({ msg: ' group not found' }))
    }

    const posts = await postRepo.getAllPostsOfGroup(userId, groupId)
    const files = await prisma.file.findMany({
      where: {
        postId: {
          in: posts.map((post: any) => post.id)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(httpStatus.OK).json(getApiResponse({ data: { files } }))
  } catch (error) {
    next(error)
  }
}
