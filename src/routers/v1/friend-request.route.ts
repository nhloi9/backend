import { Router } from 'express'

import { friendRequestControllers as controller } from '../../controllers'
import { verifyToken } from '../../middlewares'

const router = Router()
router.use(verifyToken)

// router.get('/friends', controller.getAllFriends)
// router.get('/receive', controller.getReceiveRequests)
// router.get('/send', controller.getSendRequests)

router
  .route('/')
  .get(verifyToken, controller.getAllRequests)
  .post(verifyToken, controller.createRequestFriend)

router.get('/suggests', controller.getSuggestFriends)
router
  .route('/:id')
  .delete(verifyToken, controller.deleteRequestFriend)
  .put(verifyToken, controller.updateRequestFriend)
export default router
