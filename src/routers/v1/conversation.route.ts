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
router.put('/image', verifyToken, controller.updateAvatar)
router.put('/name', verifyToken, controller.updateName)
router.post('/members', verifyToken, controller.addMember)
router.delete('/members/:memberId', verifyToken, controller.deleteMember)

export default router
