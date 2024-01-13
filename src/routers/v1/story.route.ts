import { Router } from 'express'

import { storyControllers as controller } from '../../controllers'
import { storyValidation as validation } from '../../validations'
import { verifyToken } from '../../middlewares'

const router = Router()

router.post('/', validation.createStory, verifyToken, controller.createStory)
router.get('/', verifyToken, controller.getHomeStories)
router.post(
  '/:id/comment',
  validation.commentStory,
  verifyToken,
  controller.commentStory
)

router
  .route('/:id/react')
  .post(verifyToken, validation.reactStory, controller.reactStory)
export default router
