import { type Request, type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'
import CryptoJS from 'crypto-js'
import bcrypt from 'bcrypt'
import queryString from 'qs'
import Axios from 'axios'
import jwt from 'jsonwebtoken'

import { friendRepo, postRepo, userRepo } from '../repositories'
import { generateToken, getApiResponse } from '../utils'
import { messages } from '../constants'
import { userMail } from '../mail'
import { tokenSettings, oauth2Settings, socketTokenSettings } from '../configs'
import type { RequestPayload } from '../types'
import { prisma } from '../database/postgres'
import { error } from 'console'
import { auth } from 'firebase-admin'

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstname, lastname, email, password } = req.body
    const existingUser = await userRepo.findUser({
      email
      // active: true
    })
    // console.log(existingUser)

    if (existingUser !== null) {
      res
        .status(httpStatus.CONFLICT)
        .json(getApiResponse(messages.USER_EXISTED, res, 'USER_EXISTED'))
    } else {
      // const user = await userRepo.createUser({ ...req.body, active: false })
      const ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify({
          email,
          firstname,
          lastname,
          password: bcrypt.hashSync(password, 5),
          exp: Date.now() + 60 * 1000
        }),
        process.env.ACTIVE_CIPHER_SECRET ?? 'kjdkj'
      )
        .toString()
        .replace(/\+/g, 'p1L2u3S')
        .replace(/\//g, 's1L2a3S4h')
        .replace(/=/g, 'e1Q2u3A4l')
      const mjmlContent = `
      <mjml>
        <mj-body>
          <mj-container>
            <mj-section>
              <mj-column>
                <mj-text font-size="20px" color="#333">Welcome to Our Service</mj-text>
                <mj-text font-size="16px" color="#666">Thank you for signing up for our service. To activate your account, please click the button below:</mj-text>
                <mj-button href="${
                  process.env.CLIENT_URL as string
                }/active-email/${ciphertext}" background-color="#007BFF" color="#fff">Activate Account</mj-button>
              </mj-column>
            </mj-section>
          </mj-container>
        </mj-body>
      </mjml>
    `
      userMail.sendActivateMail({
        from: 'nguyenhuuloi23052001@gmail.com',
        to: req.body.email,
        subject: 'Test mail',
        html: mjmlContent
      })

      res
        .status(httpStatus.OK)
        .json(
          getApiResponse(
            messages.USER_REGISTERED_SUCCESS,
            res,
            'USER_REGISTERED_SUCCESS'
          )
        )
    }
  } catch (error) {
    next(error)
  }
}

export const activeAcount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ciphertext = req.params.ciphertext
      .replace(/p1L2u3S/g, '+')
      .replace(/s1L2a3S4h/g, '/')
      .replace(/e1Q2u3A4l/g, '=')
    const decode = CryptoJS.AES.decrypt(
      ciphertext,
      process.env.ACTIVE_CIPHER_SECRET ?? 'kjdkj'
    ).toString(CryptoJS.enc.Utf8)
    if (decode === '') {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(getApiResponse(messages.USER_INVALID_ACTIVE_TOKEN))
    }
    const { exp, ...userData } = JSON.parse(decode)
    if (exp < Date.now()) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(getApiResponse(messages.ACTIVE_TOKEN_EXPIRED))
    }
    const existingUser = await userRepo.findUser({ email: userData.email })
    if (existingUser !== null) {
      res
        .status(httpStatus.CONFLICT)
        .json(getApiResponse(messages.USER_EXISTED, res, 'USER_EXISTED'))
    } else {
      await userRepo.createUser({ userData })
      res
        .status(httpStatus.CREATED)
        .json(
          getApiResponse(
            messages.USER_ACTIVE_SUCCESS,
            res,
            'USER_ACTIVE_SUCCESS'
          )
        )
    }
  } catch (error) {
    next(error)
  }
}

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body
    let user: any = await prisma.user.findUnique({
      where: { email }
    })
    // if (user?.birthday !== null && user?.birthday !== undefined) {
    //   console.log(user?.birthday.getHours())
    // }

    if (user == null) {
      res
        .status(httpStatus.NOT_FOUND)
        .json(
          getApiResponse(
            messages.USER_INCORECT_EMAIL_PASSWORD,
            res,
            'USER_INCORECT_EMAIL_PASSWORD'
          )
        )
    } else {
      const matchPassword = bcrypt.compareSync(password, user.password ?? '')
      if (!matchPassword) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json(
            getApiResponse(
              messages.USER_INCORECT_EMAIL_PASSWORD,
              res,
              'USER_INCORECT_EMAIL_PASSWORD'
            )
          )
      }

      user = await userRepo.findUser({ email })
      if (user.password !== null) delete user.password

      const { id, role } = user
      const token = generateToken({
        data: {
          id,
          role
        },
        secret: tokenSettings.secret,
        exp: tokenSettings.expireTime
      })

      const socketToken = generateToken({
        data: {
          id,
          role
        },
        secret: socketTokenSettings.secret,
        exp: socketTokenSettings.expireTime
      })

      res
        .status(httpStatus.OK)
        .cookie('token', token, {
          maxAge: tokenSettings.expireTime * 1000,
          secure: true
        })
        .json(
          getApiResponse({
            data: {
              user: { ...user, password: undefined },
              socketToken
            }
          })
        )
    }
  } catch (error) {
    next(error)
  }
}

export const getUser = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    // console.log(await prisma.react.findMany())
    const user = await userRepo.findUser({ id: (req.payload as any).id })
    if (user === null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }
    if (user.password !== null) delete user.password
    // if (user.detail !== null) {
    //   user.detail.birthday =
    //     user.detail.birthday === null ? null : user.detail.birthday
    // }

    // console.log({ secret: tokenSettings.secret, exp: tokenSettings.expireTime })
    // console.log({
    //   secret: socketTokenSettings.secret,
    //   exp: socketTokenSettings.expireTime
    // })
    const token = generateToken({
      data: { id: user.id, role: user.role },
      secret: tokenSettings.secret,
      exp: tokenSettings.expireTime
    })
    const socketToken = generateToken({
      data: { id: user.id, role: user.role },
      secret: socketTokenSettings.secret,
      exp: socketTokenSettings.expireTime
    })
    res
      .status(httpStatus.OK)
      .cookie('token', token, {
        maxAge: tokenSettings.expireTime * 1000,
        httpOnly: true
      })
      .json(
        getApiResponse({
          data: {
            user,
            socketToken
          }
        })
      )
  } catch (error) {
    next(error)
  }
}

export const getUserInfo = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const user = await userRepo.findUser({ id: Number(id) })

    if (user === null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }
    const friends = await friendRepo.findAllFriends(Number(id))
    delete user?.password
    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          user: { ...user, password: undefined, friends }
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getGroupRequests = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: (req.payload as any).id
      },
      select: {
        groupRequests: {
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
        }
      }
    })
    let groupRequests: any = []
    if (user !== null) {
      groupRequests = user.groupRequests
    }

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          groupRequests
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const getOauthUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authParams = queryString.stringify({
      client_id: oauth2Settings.clientId,
      redirect_uri: oauth2Settings.redirectUrl,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
      state: 'standard_oauth',
      prompt: 'consent'
    })
    const url = `${oauth2Settings.authUrl}?${authParams}`

    // res.status(httpStatus.OK).json(
    //   getApiResponse({
    //     data: {
    //       url
    //     }
    //   })
    // )
    res.redirect(url)
  } catch (error) {
    res.redirect('http://localhost:3000/signin')
    next(error)
  }
}

export const getOauthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query
    if (code === undefined) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(getApiResponse(messages.OAUTH_ERROR, res, 'OATH_ERROR'))
    }
    const tokenParam = queryString.stringify({
      client_id: oauth2Settings.clientId,
      client_secret: oauth2Settings.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: oauth2Settings.redirectUrl
    })

    const {
      data: { id_token } // eslint-disable-line
    } = await Axios.post(`${oauth2Settings.tokenUrl}?${tokenParam}`)

    if (id_token === undefined) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(getApiResponse(messages.OAUTH_ERROR, res, 'OATH_ERROR'))
    }
    const decode: any = jwt.decode(id_token)
    const { email, given_name, family_name, picture } = decode //eslint-disable-line
    let user = await userRepo.findUser({ email })
    if (user === null) {
      user = await userRepo.createUser({
        userData: { email, firstname: given_name, lastname: family_name },
        avatar: { name: 'avatar', url: picture }
      })
    }

    const token = generateToken({
      data: {
        id: user.id
      },
      secret: tokenSettings.secret,
      exp: tokenSettings.expireTime
    })

    res
      .cookie('token', token, {
        maxAge: tokenSettings.expireTime * 1000,
        httpOnly: true
      })
      .redirect('http://localhost:3000')
  } catch (error) {
    // console.log(error)
    res.redirect('http://localhost:3000/signin')
  }
}

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(httpStatus.OK).cookie('token', '', { maxAge: 1 }).send('ok')
}

export const updateAvatar = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userRepo.findUser({ id: (req.payload as any).id })
    if (user === null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }
    const { name, url } = req.body

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        avatar: {
          disconnect: true,
          create: {
            name,
            url
          }
        }
      }
    })
    res
      .status(200)
      .json(
        getApiResponse(
          messages.USER_UPDATE_AVATAR_SUCCESS,
          res,
          'USER_UPDATE_AVATAR_SUCCESS'
        )
      )
  } catch (error) {
    next(error)
  }
}

export const updateCoverImage = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userRepo.findUser({ id: (req.payload as any).id })
    if (user === null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }
    const { name, url } = req.body
    // await fileRepo
    //   .deleteFile({
    //     coverImageOfUserDetailId: user.detail.id
    //   })
    //   .catch(err => {
    //     console.log(err)
    //   })

    // await fileRepo.createFile({
    //   name,
    //   url,
    //   coverImageOfUserDetailId: user.detail.id
    // })
    if (user.detail === null) {
      await prisma.userDetail.create({
        data: {
          user: {
            connect: {
              id: user.id
            }
          },
          coverImage: {
            create: {
              name,
              url
            }
          }
        }
      })
    } else {
      await prisma.userDetail
        .update({
          where: {
            id: user.detail.id
          },
          data: {
            coverImage: {
              disconnect: true,
              create: {
                name,
                url
              }
            }
          }
        })
        .catch(error)
    }
    res
      .status(200)
      .json(
        getApiResponse(
          messages.USER_UPDATE_COVER_IMAGE_SUCCESS,
          res,
          'USER_UPDATE_COVER_IMAGE_SUCCESS'
        )
      )
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    await userRepo.updateProfile((req.payload as any).id, req.body)
    const user = await userRepo.findUser({ id: (req.payload as any).id })
    if (user === null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }

    if (user.password !== null) delete user.password

    res.status(httpStatus.OK).json(
      getApiResponse({
        data: {
          user
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export const forgetPassword = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userRepo.findUser({ email: req.body.email })
    if (user === null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }
    const code = Math.floor(100000 + Math.random() * 900000)
    await prisma.resetPasswordCode.upsert({
      where: { userId: user.id },
      update: { value: code, expireTime: new Date(Date.now() + 40 * 1000) },
      create: {
        userId: user.id,
        value: code,
        expireTime: new Date(Date.now() + 40 * 1000)
      }
    })
    const mjmlContent = `
    <mjml>
      <mj-body>
        <mj-container>
          <mj-section>
            <mj-column>
              <mj-text font-size="20px" color="#333">We have confirmed your password reset request</mj-text>
              <mj-text font-size="16px" color="#666">Your reset password code :</mj-text>
              <mj-button  background-color="#007BFF" color="#fff">${code}</mj-button>
            </mj-column>
          </mj-section>
        </mj-container>
      </mj-body>
    </mjml>
  `

    userMail.sendActivateMail({
      from: 'nguyenhuuloi23052001@gmail.com',
      to: req.body.email,
      subject: 'Test mail',
      html: mjmlContent
    })

    res
      .status(httpStatus.OK)
      .json(getApiResponse(messages.USER_REQUEST_FORGET_PASSWORD_SUCCESS))
  } catch (error) {
    next(error)
  }
}

export const verifyResetPassword = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userRepo.findUser({ email: req.body.email })
    if (user === null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }

    const code = await prisma.resetPasswordCode.findUnique({
      where: { userId: user.id, expireTime: { gt: new Date() } }
    })

    if (code === null || code.value !== req.body.code) {
      return res.status(400).json({ msg: 'invalid code' })
    }

    res
      .status(httpStatus.OK)
      .json(getApiResponse(messages.VERIFY_RESET_PASSWORD_SUCCESS))
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newPassword, email, code } = req.body
    const user: any = await prisma.user
      .update({
        where: {
          email,
          resetPasswordCode: {
            AND: {
              value: code,
              expireTime: {
                gt: new Date()
              }
            }
          }
        },
        data: {
          password: bcrypt.hashSync(newPassword, 5),
          resetPasswordCode: {
            disconnect: true
          }
        },

        include: {
          avatar: true,
          detail: {
            include: {
              coverImage: true
            }
          }
        }
      })
      .catch(error => {
        console.log(error)
      })
    if (user === null || user === undefined) {
      return res.status(400).json(getApiResponse({ msg: 'Unauthenticated' }))
    }
    const { id, role } = user
    const token = generateToken({
      data: {
        id,
        role
      },
      secret: tokenSettings.secret,
      exp: tokenSettings.expireTime
    })
    const socketToken = generateToken({
      data: { id: user.id, role: user.role },
      secret: socketTokenSettings.secret,
      exp: socketTokenSettings.expireTime
    })
    delete user.password

    res
      .status(httpStatus.OK)
      .cookie('token', token, {
        maxAge: tokenSettings.expireTime * 1000,
        secure: true
      })
      .json(
        getApiResponse({
          data: { socketToken, user: { ...user } }
        })
      )
  } catch (error) {
    next(error)
  }
}

export const changePassword = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newPassword, oldPassword } = req.body

    const user: any = await prisma.user.findUnique({
      where: { id: (req.payload as any).id }
    })

    if (user == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }
    const matchPassword = bcrypt.compareSync(oldPassword, user.password ?? '')
    if (!matchPassword) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(getApiResponse(messages.USER_INCORECT_PASSWORD))
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: bcrypt.hashSync(newPassword, 5) }
    })

    res.status(httpStatus.OK).json(getApiResponse({ msg: 'Password changed' }))
  } catch (error) {
    next(error)
  }
}

export const setPassword = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newPassword } = req.body

    const user: any = await prisma.user.findUnique({
      where: { id: (req.payload as any).id }
    })

    if (user == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(getApiResponse(messages.USER_NOT_FOUND, res, 'USER_NOT_FOUND'))
    }
    if (user.password !== null) {
      return res
        .status(400)
        .json(getApiResponse({ msg: 'password already exists' }))
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: bcrypt.hashSync(newPassword, 5) }
    })

    res.status(httpStatus.OK).json(getApiResponse({ msg: 'Password seted' }))
  } catch (error) {
    next(error)
  }
}

export const search = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const q: any = req.query.q
    console.log({ q })
    const tokens: string[] = q
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(' ')
      .filter((token: string) => {
        return token.trim().length > 0
      })
    // if (tokens.length === 1) {
    const users = await prisma.user.findMany({
      where: {
        AND: tokens.map(token => ({
          fullname: {
            contains: token
          }
        }))
      },
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
    })
    // } else {
    //   users = await prisma.user.findMany({
    //     where: {
    //       fullname: {
    //         search: tokens.join('&')
    //       }
    //     }
    //   })
    // }
    console.log(users)
    res.status(httpStatus.OK).json(getApiResponse({ data: { users } }))
  } catch (error) {
    next(error)
  }
}

export const getAllFilesOfUser = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userId = (req.payload as any).id
    const posts = await postRepo.getAllPostsOfUser(userId, Number(id))
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

export const getAllStoriesOfUser = async (
  req: RequestPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const stories = await prisma.story.findMany({
      where: {
        userId: Number(id)
      },
      orderBy: {
        createdAt: 'desc'
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
      }
    })
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
