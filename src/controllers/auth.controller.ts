import { type Request, type Response, type NextFunction } from 'express'
import httpStatus from 'http-status'
import queryString from 'qs'
import Axios from 'axios'
import jwt from 'jsonwebtoken'

// import { userRepo } from '../repositories'
import { generateToken, getApiResponse } from '../utils'
import { messages } from '../constants'
import { oauth2Settings, tokenSettings } from '../configs'
import { userRepo } from '../repositories'

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
    // console.log(decode)
    const { email, given_name, family_name, picture } = decode //eslint-disable-line
    let user = await userRepo.findUser({ email })
    if (user === null) {
      user = await userRepo.createUser({
        email,
        firstname: given_name,
        lastname: family_name,
        avatar: picture
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
