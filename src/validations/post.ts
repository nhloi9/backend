import { Joi, type schema } from 'express-validation'

import validate from './validate'

const createPost: schema = {
  body: Joi.object({
    text: Joi.string(),
    files: Joi.array(),
    privacy: Joi.string(),
    tags: Joi.array().items(Joi.number()),
    feel: Joi.object(),
    location: Joi.object(),
    groupId: Joi.number(),
    shareId: Joi.number()
  })
}
const reactPost: schema = {
  body: Joi.object({
    reactId: Joi.number().required()
  })
}

export const postValidation = {
  createPost: validate(createPost),
  reactPost: validate(reactPost)
}
