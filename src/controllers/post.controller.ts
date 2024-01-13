import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'
// import tf from '@tensorflow/tfjs-node'
// import use from '@tensorflow-models/universal-sentence-encoder';

import _ from 'lodash'

import { postRepo } from '../repositories'
import type { RequestPayload } from '../types'
import { getApiResponse } from '../utils'
import { prisma } from '../database/postgres'
import { checkIsFriend } from '../repositories/friend'
import { use } from 'passport'

export const createPost = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { text, files, feel, location, tags, groupId, privacy, shareId } =
    req.body
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
      shareId
    })
    if (post?.shareId !== null) {
      const share = await postRepo.getSinglePost(userId, post.shareId)
      post.share = share
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
  const { text, files, feel, location, tags, groupId } = req.body

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
      postId: Number(req.params.id),
      userId: (req.payload as any).id,
      text,
      feel,
      location,
      files,
      tags,
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
    const { oldPosts } = req.body
    let posts = await postRepo.getPosts(oldPosts)
    posts = posts.map((post: any, index: number) => {
      return {
        ...post

        // ...(numberComments > 5 && {
        //   sampleComment: _.sampleSize(
        //     post.comments,
        //     Math.floor(Math.random() * 4)
        //   )
        // })
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
          posts: _.sampleSize(posts, 10)
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
// function getPostsByFriend (userId: number) {}
// function getPostsByLike (userId: number) {}
// function getPostsBy

export const searchPosts = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query
    const userId = Number((req.payload as any).id)
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
          search: q as string
        },
        accepted: true
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
          search: q as string,
          sort: 'asc'
        }
      }
    })

    // for (const post of posts) {
    //   if (post?.shareId !== null) {
    //     const share = await postRepo.getSinglePost(userId, post.shareId)
    //     post.share = share
    //   }
    // }
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
