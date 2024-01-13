import { Joi, type schema } from 'express-validation'

import validate from './validate'

const createStory: schema = {
  body: Joi.object({
    mutedOriginal: Joi.boolean().required(),
    song: Joi.object(),
    file: Joi.object().required(),
    texts: Joi.array().items(Joi.object())
  })
}

const reactStory: schema = {
  body: Joi.object({
    reactId: Joi.number().required()
  })
}
const commentStory: schema = {
  body: Joi.object({
    content: Joi.string().required()
  })
}

export const storyValidation = {
  createStory: validate(createStory),
  reactStory: validate(reactStory),
  commentStory: validate(commentStory)
}
