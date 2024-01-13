import { Joi, type schema } from 'express-validation'

import validate from './validate'

const createMessage: schema = {
  body: Joi.object({
    conversationId: Joi.number().required(),
    text: Joi.string().required(),
    files: Joi.array().required()
  })
}

const getMessages: schema = {
  query: Joi.object({
    conversationId: Joi.number().required(),
    cusor: Joi.number(),
    limitPerPage: Joi.number().min(1)
  })
}
// const reactPost: schema = {
//   body: Joi.object({
//     reactId: Joi.number().required()
//   })
// }

export const messageValidation = {
  createMessage: validate(createMessage),
  getMessages: validate(getMessages)
  // reactPost: validate(reactPost)
}
