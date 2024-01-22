import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'

import _ from 'lodash'

import { friendRepo, notifyRepo, postRepo } from '../repositories'
import type { RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { prisma } from '../database/postgres'

export const createPost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const {
    text,
    files,
    feel,
    location,
    tags,
    groupId,
    privacy,
    shareId,
    hashtags
  } = req.body
  const userId = (req.payload as any).id
  try {
    const group =
      groupId !== undefined
        ? await prisma.group.findUnique({ where: { id: groupId } })
        : null

    const post: any = await postRepo.createPost({
      userId,
      text,
      feel,
      location,
      files,
      tags,
      groupId,
      privacy,
      ...(groupId !== undefined && {
        accepted: group?.adminId === userId
      }),
      shareId,
      hashtags
    })
    if (post?.shareId !== null) {
      const share = await postRepo.getSinglePost(userId, post.shareId)
      post.share = share
    }

    if (
      post.accepted === true &&
      post.group === null &&
      post.privacy !== 'private'
    ) {
      const friendIds = await friendRepo.findAllFriendIds(userId)

      const invitesPromise = friendIds.map(async (id: number): Promise<any> => {
        return await notifyRepo.createNotify({
          notifyData: {
            text: 'added a new post',
            url:
              (process.env.CLIENT_URL as string) +
              `/post/${post?.id as string}`,

            image: post.files[0]?.thumbnail ?? post.files[0]?.url
          },
          senderId: userId,
          receiverId: id
        })
      })
      await Promise.all(invitesPromise)
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { post }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const updatePost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const userId = (req.payload as any).id
  const { text, files, feel, location, tags, hashtags, privacy } = req.body

  try {
    const oldPost = await prisma.post.findFirst({
      where: {
        id: Number(req.params.id)
      },
      include: {
        group: true
      }
    })
    if (oldPost === null) {
      return res.status(400).json({
        msg: 'Post not found'
      })
    }
    const post = await postRepo.updatePost({
      privacy,
      postId: Number(req.params.id),
      userId: (req.payload as any).id,
      text,
      feel,
      location,
      files,
      tags,
      hashtags,
      accepted:
        oldPost.groupId !== null && oldPost.group?.adminId !== userId
          ? false
          : undefined
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { post }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getHomePosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id

    const friendIds = await friendRepo.findAllFriendIds(userId)
    const { oldPostIds = [] } = req.body

    const lastReacts = await prisma.postUserReact.findMany({
      where: {
        userId,
        id: { notIn: [6, 7] },
        post: {
          hashtags: {
            none: {}
          }
        }
      },
      select: {
        post: {
          select: {
            hashtags: true
          }
        }
      },
      orderBy: {},
      take: 10
    })

    const hashtags: string[] = []
    lastReacts.forEach((react: any) => {
      const hashtag = react?.post?.hashtags?.name
      if (hashtag !== undefined) {
        if (!hashtags.includes(hashtag)) {
          hashtags.push(hashtag)
        }
      }
    })

    let posts: any = await prisma.post.findMany({
      where: {
        accepted: true,
        id: {
          notIn: oldPostIds
        },
        OR: [
          {
            userId
          },
          {
            group: {
              OR: [
                {
                  adminId: userId
                },
                {
                  requests: {
                    some: {
                      userId,
                      status: 'accepted'
                    }
                  }
                }
              ]
            }
          },
          {
            groupId: null,
            userId: {
              in: friendIds
            },
            privacy: {
              not: 'private'
            }
          },
          {
            groupId: null,
            tags: {
              some: {
                id: {
                  in: friendIds
                }
              }
            },
            privacy: 'public'
          },
          {
            groupId: null,
            tags: {
              some: {
                id: userId
              }
            },
            OR: [
              {
                privacy: 'public'
              },
              {
                privacy: 'friend',
                userId: {
                  in: friendIds
                }
              }
            ]
          },
          {
            hashtags: {
              some: {
                name: {
                  in: hashtags
                }
              }
            },
            privacy: 'public',
            OR: [
              {
                groupId: null
              },
              {
                group: {
                  privacy: 'public'
                }
              }
            ]
          }
        ]
      },

      take: 8,
      include: {
        hashtags: true,
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
          },
          orderBy: {
            createdAt: 'desc'
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
      }
    })
    let addedPost: any = []

    if (posts?.length < 5) {
      const ids = posts.map((post: any) => post.id)
      // console.log(ids)
      addedPost = await prisma.post.findMany({
        where: {
          id: {
            notIn: ids
          },
          privacy: 'public',
          OR: [
            {
              groupId: null
            },
            {
              group: {
                privacy: 'public'
              }
            }
          ]
        },

        take: 5 - posts.length,
        include: {
          hashtags: true,
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
            },
            orderBy: {
              createdAt: 'desc'
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
        }
      })
      // console.log(addedPost)
    }

    posts = _.sampleSize([...posts, ...addedPost], 5)
    for (const post of posts) {
      if (post?.shareId !== null) {
        const share = await postRepo.getSinglePost(userId, post.shareId)
        post.share = share
      }
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getUserPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id
    const { id } = req.params

    const posts = await postRepo.getAllPostsOfUser(userId, Number(id))
    for (const post of posts) {
      if (post?.shareId !== null) {
        const share = await postRepo.getSinglePost(userId, post.shareId)
        post.share = share
      }
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts
        }
      })
    )
  } catch (error) {
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts: []
        }
      })
    )
  }
}

export const getSinglePost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id
    const { id } = req.params

    const post = await postRepo.getSinglePost(userId, Number(id))
    if (post === null) {
      return res.status(400).json(
        getApiResponse({
          msg: 'Post not visible'
        })
      )
    }

    if (post?.shareId !== null) {
      const share = await postRepo.getSinglePost(userId, post.shareId)
      post.share = share
    }

    return res.status(200).json(
      getApiResponse({
        data: { post }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getGroupPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userId = Number((req.payload as any).id)
    const posts = await postRepo.getAllPostsOfGroup(userId, Number(id))
    for (const post of posts) {
      if (post?.shareId !== null) {
        const share = await postRepo.getSinglePost(userId, post.shareId)
        post.share = share
      }
    }
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const reactPost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { reactId } = req.body
  const postId = Number(req.params.id)
  const userId = (req.payload as any).id
  try {
    await prisma.postUserReact.upsert({
      where: {
        postId_userId: {
          postId,
          userId
        }
      },
      update: {
        reactId
      },
      create: {
        reactId,
        postId,
        userId
      }
    })

    res.status(httpStatus.OK).json({ msg: 'react post successfully' })
  } catch (error) {
    next(error)
  }
}

export const removeReactPost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const postId = Number(req.params.id)
  const userId = (req.payload as any).id
  try {
    await prisma.postUserReact.deleteMany({
      where: {
        postId,
        userId
      }
    })

    res.status(httpStatus.OK).json({ msg: 'react post successfully' })
  } catch (error) {
    next(error)
  }
}

export const groupFeedPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id

    const posts: any = await prisma.post.findMany({
      where: {
        group: {
          OR: [
            { adminId: userId },
            {
              requests: {
                some: {
                  userId,
                  status: 'accepted'
                }
              }
            }
          ]
        },
        accepted: true
      },

      include: {
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
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            privacy: true,
            image: true
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    for (const post of posts) {
      if (post?.shareId !== null) {
        const share = await postRepo.getSinglePost(userId, post.shareId)
        post.share = share
      }
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts
        }
      })
    )
  } catch (error) {
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts: []
        }
      })
    )
  }
}

export const savePost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userId = (req.payload as any).id
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        savedPost: {
          connect: {
            id: Number(id)
          }
        }
      }
    })

    res
      .status(httpStatus.OK)
      .json(getApiResponse({ msg: 'Post saved successfully' }))
  } catch (error) {
    next(error)
  }
}

export const unsavePost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userId = (req.payload as any).id
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        savedPost: {
          disconnect: {
            id: Number(id)
          }
        }
      }
    })

    res
      .status(httpStatus.OK)
      .json(getApiResponse({ msg: 'Post saved successfully' }))
  } catch (error) {
    next(error)
  }
}

export const getSavePosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number((req.payload as any).id)
    const posts: any = await prisma.post.findMany({
      where: {
        saveBys: {
          some: {
            id: userId
          }
        }
      },
      include: {
        hashtags: true,
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            privacy: true,
            image: true
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    for (const post of posts) {
      if (post?.shareId !== null) {
        const share = await postRepo.getSinglePost(userId, post.shareId)
        post.share = share
      }
    }
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const searchPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const q: any = req.query.q
    console.log({ q })
    const tokens: string[] = q
      .trim()
      // .normalize('NFD')
      // .replace(/[\u0300-\u036f]/g, '')
      // .toLowerCase()
      .split(' ')
      .filter((token: string) => {
        return token.trim().length > 0
      })

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          {
            groupId: null,
            privacy: 'public'
          },
          {
            group: {
              privacy: 'public'
            }
          }
        ],
        text: {
          search: tokens.join(' & ')
        },
        accepted: true
      },
      include: {
        hashtags: true,
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            privacy: true,
            image: true
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
        }
      },
      orderBy: {
        _relevance: {
          fields: ['text'],
          search: tokens.join(' & '),
          sort: 'asc'
        }
      }
    })

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getDiscoverPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id

    const today = new Date()

    const dayOfWeek = today.getDay()
    const difference = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const startOfWeek = new Date(today.setDate(difference))
    startOfWeek.setHours(0, 0, 0, 0)

    const reactsOfWeek = await prisma.postUserReact.findMany({
      where: {
        createdAt: {
          gte: startOfWeek
        },
        react: {
          id: {
            in: [1, 2, 3, 4, 5]
          }
        },
        post: {
          OR: [
            {
              groupId: null,
              privacy: 'public'
            },
            {
              group: {
                privacy: 'public'
              },
              accepted: true
            }
          ]
        }
      }
    })

    const postIds: any = {}
    reactsOfWeek.forEach((react: any) => {
      if (postIds[react.postId] !== undefined) {
        postIds[react.postId] = (postIds[react.postId] as number) + 1
      } else postIds[react.postId] = 1
    })

    const topIds = Object.keys(postIds)
      .sort((a: string, b: string) => {
        return postIds[b] - postIds[a]
      })
      .slice(0, 20)

    const posts: any = await prisma.post.findMany({
      where: {
        id: { in: topIds.map((id: string) => Number(id)) }
      },

      include: {
        hashtags: true,
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
          },
          orderBy: {
            createdAt: 'desc'
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
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            privacy: true,
            image: true
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    for (const post of posts) {
      if (post?.shareId !== null) {
        const share = await postRepo.getSinglePost(userId, post.shareId)
        post.share = share
      }
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts
        }
      })
    )
  } catch (error) {
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts: []
        }
      })
    )
  }
}

export const createReport = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id
    const postId = Number(req.params.id)
    const { type } = req.body

    await prisma.report.upsert({
      where: {
        userId_postId: {
          userId,
          postId
        }
      },
      update: {
        type
      },
      create: {
        userId,
        postId,
        type
      }
    })

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { msg: 'Report successfully' }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getReportedPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.payload
    if (user?.role !== 'admin') {
      return res.status(400).json({
        msg: 'can not access to admin'
      })
    }

    let posts: any = await prisma.post.findMany({
      where: {
        NOT: {
          reports: {
            none: {}
          }
        }
      },

      include: {
        hashtags: true,
        reports: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                avatar: true
              }
            }
          },

          orderBy: {
            updatedAt: 'desc'
          }
        },
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            privacy: true,
            image: true
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
        }
      }
    })
    console.log({ posts })

    posts = posts.sort(
      (a: any, b: any) =>
        new Date(b.reports[0].updatedAt).getTime() -
        new Date(a.reports[0].updatedAt).getTime()
    )

    const userId = Number((req.payload as any).id)

    for (const post of posts) {
      if (post?.shareId !== null) {
        const share = await postRepo.getSinglePost(userId, post.shareId)
        post.share = share
      }
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getHashtagdPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id
    const { hashtag } = req.query

    const posts: any = await prisma.post.findMany({
      where: {
        accepted: true,
        hashtags: {
          some: {
            name: hashtag as string
          }
        }
      }
    })

    const returnedPosts = []
    for (const post of posts) {
      const returnedPost = await postRepo.getSinglePost(userId, post.id)
      if (post !== null) returnedPosts.push(returnedPost)
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          posts: returnedPosts
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const keepReportedPost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.payload
    const { id } = req.params
    if (user?.role !== 'admin') {
      return res.status(400).json({
        msg: 'can not access to admin'
      })
    }

    await prisma.report.deleteMany({
      where: {
        postId: Number(id)
      }
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        msg: 'Keep the report successfully'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const deletePost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id
    const { id } = req.params
    const post = await prisma.post.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        group: true
      }
    })
    if (post === null) {
      return res.status(400).json(getApiResponse({ msg: 'Post not found' }))
    }
    if (
      post.userId !== userId &&
      (req.payload as any).role !== 'admin' &&
      post?.group?.adminId !== userId
    ) {
      return res.status(400).json(
        getApiResponse({
          msg: 'You do not have permission'
        })
      )
    }
    await prisma.post.delete({
      where: {
        id: Number(req.params.id)
      }
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        msg: 'Delete the post successfully'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getAllHashtags = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const hashtags = await prisma.hashtag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                accepted: true
              }
            }
          }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      }
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { hashtags }
      })
    )
  } catch (error) {
    next(error)
  }
}
