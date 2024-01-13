import { Router } from 'express'

import { messageControllers as controller } from '../../controllers'
import { verifyToken } from '../../middlewares'
import { messageValidation as validation } from '../../validations'

const router = Router()

router
  .route('/')
  .get(verifyToken, validation.getMessages, controller.getMessages)
  .post(verifyToken, validation.createMessage, controller.createMessage)

export default router
