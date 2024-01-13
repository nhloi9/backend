import { Router } from 'express'

import { conversationControllers as controller } from '../../controllers'
import { verifyToken } from '../../middlewares'

const router = Router()

router
  .route('/')
  .get(verifyToken, controller.getAllConversation)
  .post(verifyToken, controller.createConversation)

router.get('/:id', verifyToken, controller.getConversation)
router.put('/:id/seen', verifyToken, controller.seenConversation)

export default router
