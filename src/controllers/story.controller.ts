import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'

import { friendRepo, storyRepo } from '../repositories'
import type { RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { prisma } from '../database/postgres'

export const createStory = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { mutedOriginal, song, file, texts } = req.body
  try {
    const story = await storyRepo.createStory(
      mutedOriginal,
      song,
      (req.payload as any).id,
      file,
      texts
    )
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { story }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getHomeStories = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.payload as any).id
    const friends = await friendRepo.findAllFriends(userId)
    const myStories = await prisma.story.findMany({
      where: { userId },

      include: {
        video: {
          select: {
            id: true,
            name: true,
            url: true
          }
        },
        texts: true,

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
        },
        views: {
          select: {
            id: true
            // firstname: true,
            // lastname: true,
            // avatar: {
            //   select: {
            //     id: true,
            //     name: true,
            //     url: true
            //   }
            // }
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
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
        },
        reacts: {
          include: {
            react: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    const friendsStories = await prisma.story.findMany({
      where: {
        userId: {
          in: friends.map((friend: any) => friend.id)
        }
      },

      include: {
        video: {
          select: {
            id: true,
            name: true,
            url: true
          }
        },
        texts: true,

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
        },
        views: {
          select: {
            id: true
            // firstname: true,
            // lastname: true,
            // avatar: {
            //   select: {
            //     id: true,
            //     name: true,
            //     url: true
            //   }
            // }
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
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
        },
        reacts: {
          include: {
            react: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    const stories = [...myStories, ...friendsStories]
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          stories
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const reactStory = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { reactId } = req.body
  const storyId = Number(req.params.id)
  const userId = (req.payload as any).id
  try {
    await prisma.reactStory.upsert({
      where: {
        storyId_userId: {
          storyId,
          userId
        }
      },
      update: {
        reactId
      },
      create: {
        reactId,
        storyId,
        userId
      }
    })
    res.status(httpStatus.OK).json({ msg: 'react story successfully' })
  } catch (error) {
    next(error)
  }
}

export const commentStory = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body
    const storyId = Number(req.params.id)
    const comment = await prisma.commentStory.create({
      data: {
        userId: (req.payload as any).id,
        storyId,
        content
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
                name: true,
                url: true
              }
            }
          }
        }
      }
    })

    res.status(httpStatus.OK).json(getApiResponse({ data: { comment } }))
  } catch (error) {
    next(error)
  }
}
