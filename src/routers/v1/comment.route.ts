import { Router } from 'express'

import { commentControllers as controller } from '../../controllers'
import { commentValidation as validation } from '../../validations'
import { verifyToken } from '../../middlewares'

const router = Router()

router
  .route('/')
  .post(validation.createComment, verifyToken, controller.createComment)
  .get(verifyToken, validation.getComments, controller.getComments)
// router.get('/home', verifyToken, controller.getHomePosts)
// router
//   .route('/:id/react')
//   .post(verifyToken, validation.reactPost, controller.reactPost)
//   .delete(verifyToken, controller.removeReactPost)
router.route('/:id').put(verifyToken, controller.updateComment)
router
  .route('/:id/react')
  .post(verifyToken, controller.reactComment)
  .delete(verifyToken, controller.deleteReactComment)
export default router
