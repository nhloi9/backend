import { Joi, type schema } from 'express-validation'

import validate from './validate'

const createComment: schema = {
  body: Joi.object({
    postId: Joi.number().required(),
    parentId: Joi.number(),
    receiverId: Joi.number(),
    content: Joi.string().required()
  })
}

const getComments: schema = {
  query: Joi.object({
    postId: Joi.string().required(),
    cusor: Joi.string(),
    limitPerPage: Joi.number().min(1)
  })
}
// const reactPost: schema = {
//   body: Joi.object({
//     reactId: Joi.number().required()
//   })
// }

export const commentValidation = {
  createComment: validate(createComment),
  getComments: validate(getComments)
  // reactPost: validate(reactPost)
}
