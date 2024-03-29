import { prisma } from '../database/postgres'
import { checkIsFriend } from './friend'
import { checkIsMember } from './group'
import { groupRepo, userRepo } from '.'
// import { type IUser } from '../types'

const createPost = async ({
  files = [],
  tags = [],
  hashtags = [],

  ...postData
}: any): Promise<any> => {
  const newPost = await prisma.post.create({
    data: {
      ...postData,
      ...(files.length > 0 && {
        files: {
          create: files
        }
      }),

      ...(tags?.length > 0 && {
        tags: {
          connect: tags.map((id: number) => ({
            id
          }))
        }
      }),
      ...(hashtags?.length > 0 && {
        hashtags: {
          connectOrCreate: hashtags.map((hashtag: string) => {
            return {
              where: { name: hashtag },
              create: { name: hashtag }
            }
          })
        }
      })
    },
    include: {
      hashtags: true,
      shareBys: {
        select: {
          id: true,
          createdAt: true,
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
  return newPost
}

const updatePost = async ({
  files = [],
  tags = [],
  postId,
  hashtags = [],
  ...postData
}: any): Promise<any> => {
  const newPost = await prisma.post.update({
    where: {
      id: postId
    },
    data: {
      ...postData,
      files: {
        set: [],
        create: files.map((file: any) => ({
          name: file.name,
          url: file.url,
          thumbnail: file.thumbnail
        }))
      },
      tags: {
        set: [],
        connect: tags.map((id: number) => ({
          id
        }))
      },
      ...(hashtags?.length > 0 && {
        hashtags: {
          set: [],
          connectOrCreate: hashtags.map((hashtag: string) => {
            return {
              where: { name: hashtag },
              create: { name: hashtag }
            }
          })
        }
      })
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
          user: true
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
  return newPost
}

const getPosts = async (oldPosts: any): Promise<any> => {
  // const posts = await prisma.post.findMany({
  //   where: {
  //     id: {
  //       notIn: oldPosts
  //     }
  //   },
  //   include: {
  //     files: true,
  //     user: {
  //       include: { avatar: true }
  //     },
  //     reacts: {
  //       include: {
  //         react: true,
  //         user: true
  //       }
  //     },
  //     comments: {
  //       include: {
  //         sender: {
  //           select: {
  //             id: true,
  //             firstname: true,
  //             lastname: true,
  //             avatar: {
  //               select: { name: true, url: true }
  //             }
  //           }
  //         },
  //         receiver: {
  //           select: {
  //             id: true,
  //             firstname: true,
  //             lastname: true,
  //             avatar: {
  //               select: { name: true, url: true }
  //             }
  //           }
  //         },
  //         answers: {
  //           include: {
  //             sender: {
  //               select: {
  //                 firstname: true,
  //                 lastname: true,
  //                 avatar: {
  //                   select: { name: true, url: true }
  //                 },
  //                 id: true
  //               }
  //             },
  //             receiver: {
  //               select: {
  //                 id: true,
  //                 firstname: true,
  //                 lastname: true,
  //                 avatar: {
  //                   select: { name: true, url: true }
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // })
  const posts = await prisma.post.findMany({
    where: {},

    include: {
      _count: {
        select: {
          comments: true
        }
      },
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
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          privacy: true,
          image: true
        }
      },
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
  return posts
}

const getAllPostsOfUser = async (
  userId: number,
  authId: number
): Promise<any[]> => {
  const posts = await prisma.post.findMany({
    where: {
      groupId: null,
      OR: [
        {
          userId: authId
        },
        {
          tags: {
            some: {
              id: authId
            }
          }
        }
      ]
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

  const returnedPosts = []
  for (const post of posts) {
    const getedPost = await getSinglePost(userId, post?.id)
    if (getedPost !== null) {
      returnedPosts.push(post)
    }
  }

  return returnedPosts
}

const getAllPostsOfGroup = async (
  userId: number,
  groupId: number
): Promise<any[]> => {
  let posts = await prisma.post.findMany({
    where: { groupId, accepted: true },

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

  const group = await prisma.group.findFirst({
    where: { id: groupId }
  })

  if (group !== null && group.privacy === 'private') {
    if (group.adminId !== userId) {
      const isMember = await checkIsMember(userId, groupId)
      if (!isMember) posts = []
    }
  }
  return posts
}

const getSinglePost = async (
  userId: number,
  postId: number,
  isAdmin = false
): Promise<any> => {
  const post = await prisma.post.findFirst({
    where: {
      id: postId
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

  if (isAdmin) {
    return post
  }

  if (post === null) {
    return null
  }

  if (post?.group !== null) {
    if (post.group.privacy === 'private') {
      const checkIsMember = await groupRepo.checkIsMember(
        userId,
        post?.group.id
      )
      if (!checkIsMember && post.group.adminId !== userId) return null
    }
    return post
  }

  if (post?.userId === userId) {
    return post
  }
  const isFriend = await checkIsFriend(userId, post?.userId)
  if ((isFriend && post?.privacy !== 'private') || post?.privacy === 'public') {
    return post
  }
  return null
}

export {
  createPost,
  getPosts,
  updatePost,
  getAllPostsOfUser,
  getAllPostsOfGroup,
  getSinglePost
}
