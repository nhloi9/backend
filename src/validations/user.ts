import { Joi, type schema } from 'express-validation'

import validate from './validate'

const registerUser: schema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    password: Joi.string().required()
  })
}
const updateUserProfile: schema = {
  body: Joi.object({
    birthday: Joi.string().allow(null),
    firstname: Joi.string(),
    lastname: Joi.string(),
    country: Joi.string().allow(''),
    state: Joi.string().allow(''),
    intro: Joi.string().allow(''),
    website: Joi.string().allow(''),
    phone: Joi.string().allow(''),
    gender: Joi.string().allow('')
  })
}

const updateUserAvatar: schema = {
  body: Joi.object({
    name: Joi.string().required(),
    url: Joi.string().required()
  })
}
const updateUserCoverImage: schema = {
  body: Joi.object({
    name: Joi.string().required(),
    url: Joi.string().required()
  })
}

const getUser: schema = {
  query: Joi.object({
    email: Joi.string()
  })
}

const forgetPassword: schema = {
  body: Joi.object({
    email: Joi.string().required()
  })
}

const verifyResetPassword: schema = {
  body: Joi.object({
    email: Joi.string().required(),
    code: Joi.number().required()
  })
}

const resetPassword: schema = {
  body: Joi.object({
    email: Joi.string().required(),
    newPassword: Joi.string().required(),
    code: Joi.number().required()
  })
}
const changePassword: schema = {
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required()
  })
}

const setPassword: schema = {
  body: Joi.object({
    newPassword: Joi.string().required()
  })
}

const searchUser: schema = {
  query: Joi.object({
    q: Joi.string().trim().required()
  })
}

export const userValidation = {
  registerUser: validate(registerUser),
  getUser: validate(getUser),
  updateUserProfile: validate(updateUserProfile),
  updateUserAvatar: validate(updateUserAvatar),
  updateUserCoverImage: validate(updateUserCoverImage),
  forgetPassword: validate(forgetPassword),
  verifyResetPassword: validate(verifyResetPassword),
  resetPassword: validate(resetPassword),
  changePassword: validate(changePassword),
  setPassword: validate(setPassword),
  searchUser: validate(searchUser)
}
