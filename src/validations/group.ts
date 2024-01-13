import { Joi, type schema } from 'express-validation'

import validate from './validate'

const createGroup: schema = {
  body: Joi.object({
    name: Joi.string().required(),
    privacy: Joi.string().valid('private', 'public').required(),
    invites: Joi.array().items(Joi.number()).required()
  })
}

const inviteGroup: schema = {
  body: Joi.object({
    groupId: Joi.number().required(),
    invites: Joi.array().items(Joi.number()).required()
  })
}

const acceptRequest: schema = {
  body: Joi.object({
    requestId: Joi.number().required()
  })
}

const cancleRequest: schema = {
  body: Joi.object({
    requestId: Joi.number().required()
  })
}

export const groupValidation = {
  createGroup: validate(createGroup),
  inviteGroup: validate(inviteGroup),
  acceptRequest: validate(acceptRequest)
  // cancleRequest:
}
