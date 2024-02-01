import { type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'
import expandContractions from '@stdlib/nlp-expand-contractions'
import natural from 'natural'
import * as SW from 'stopword'

import { commentRepo, notifyRepo } from '../repositories'
import { getApiResponse } from '../utils'
import type { RequestPayload } from '../types'
import { prisma } from '../database/postgres'
import { error } from 'console'

// const spellchecker = new Spellchecker()
// spellchecker.suggest('hello')

export const createComment = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { content, receiverId, parentId, postId } = req.body
  const userId = (req.payload as any).id

  try {
    if (analysisSentiment(content) < 0) {
      return res.status(400).json(
        getApiResponse({
          msg: 'Your comment has been deleted due to negative emotions'
        })
      )
    }
    const comment = await commentRepo.createComment({
      content,
      receiverId,
      parentId,
      postId,
      senderId: (req.payload as any).id
    })

    const post = await prisma.post.findUnique({
      where: {
        id: postId
      }
    })

    if (userId !== post?.userId) {
      prisma.post
        .update({
          where: {
            id: postId
          },
          data: {
            views: {
              disconnect: {
                id: post?.userId
              }
            }
          }
        })
        .catch(error => {
          console.log(error)
        })
    }

    if (receiverId !== undefined && receiverId !== null) {
      if (userId !== receiverId) {
        prisma.post
          .update({
            where: {
              id: postId
            },
            data: {
              views: {
                disconnect: {
                  id: receiverId
                }
              }
            }
          })
          .catch(error => {
            console.log(error)
          })
      }
    }

    if (receiverId !== undefined && receiverId !== null) {
      if (receiverId !== userId) {
        await notifyRepo.createNotify({
          notifyData: {
            text: 'responded to your comment',
            url:
              (process.env.CLIENT_URL as string) + `/post/${postId as string}`,
            content
          },

          senderId: userId,
          receiverId
        })
      }
    } else {
      if (userId !== post?.userId) {
        await notifyRepo.createNotify({
          notifyData: {
            text: 'commented in your post',
            url:
              (process.env.CLIENT_URL as string) + `/post/${postId as string}`,
            content
          },
          senderId: userId,
          receiverId: post?.userId
        })
      }
    }
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { comment }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getComments = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId, limitPerPage = 5, cusor } = req.query

    const comments = await commentRepo.getComments(
      Number(postId),
      Number(limitPerPage),
      Number(cusor)
    )
    let newCusor
    if (comments.length > limitPerPage) {
      newCusor = comments.pop().id
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          comments,
          cusor: newCusor
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

function analysisSentiment (content: string = '') {
  // Converting contractions into standard lexicon
  const lexedContent = expandContractions(content)
  // text data to lowercase
  const casedContent = lexedContent.toLowerCase()
  // Removing non-alphabetical and special characters
  const alphaOnlyContent = casedContent.replace(/[^a-zA-Z\s]+/g, '')
  const { WordTokenizer } = natural
  const tokenizer = new WordTokenizer()
  // plitting a text into its individual meaningful units.
  let tokenizedContent: any = tokenizer.tokenize(alphaOnlyContent)
  tokenizedContent = tokenizedContent === null ? [] : tokenizedContent

  // tokenizedContent.forEach((word: any, index: number) => {
  //   tokenizedContent[index] = SpellChecker.getCorrectionsForMisspelling(word)[0]
  // })
  const filteredContent = SW.removeStopwords(tokenizedContent)

  const { SentimentAnalyzer, PorterStemmer } = natural
  const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn')
  const analysis = analyzer.getSentiment(filteredContent)
  return analysis
}

export const updateComment = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const { content } = req.body

  try {
    if (analysisSentiment(content) < 0) {
      return res.status(400).json(
        getApiResponse({
          msg: 'You cannot update your comment because it contains negative emotions'
        })
      )
    }
    const comment = await prisma.comment.update({
      where: {
        id: Number(id),
        senderId: (req.payload as any).id
      },
      data: {
        content
      },
      include: {
        sender: {
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
        receiver: {
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
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: { comment }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const deleteComment = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const userId = (req.payload as any).id

  try {
    await prisma.comment.delete({
      where: {
        id: Number(id),
        OR: [
          {
            senderId: userId
          },
          {
            post: {
              userId
            }
          }
        ]
      }
    })
    res.status(httpStatus.OK).json(
      getApiResponse({
        msg: 'Delete comment successfully'
      })
    )
  } catch (error) {
    next(error)
  }
}

export const reactComment = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const { type } = req.body

  try {
    const react = await prisma.commentReact.upsert({
      where: {
        userId_commentId: {
          commentId: Number(id),
          userId: (req.payload as any).id
        }
      },
      update: {
        type
      },
      create: {
        commentId: Number(id),
        userId: (req.payload as any).id,
        type
      },
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
    })

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          react
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const deleteReactComment = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    await prisma.commentReact
      .delete({
        where: {
          userId_commentId: {
            commentId: Number(id),
            userId: (req.payload as any).id
          }
        }
      })
      .catch(err => {
        console.log(err)
      })
    res.status(httpStatus.OK).json(
      getApiResponse({
        msg: 'Delete react comment success'
      })
    )
  } catch (error) {
    next(error)
  }
}
