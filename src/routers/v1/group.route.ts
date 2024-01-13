import { Router } from 'express'

import { groupControllers as controller } from '../../controllers'
import { groupValidation as validation } from '../../validations'
import { verifyToken } from '../../middlewares'

const router = Router()

router.post('/', verifyToken, validation.createGroup, controller.createGroup)
router.get('/own', verifyToken, controller.getOwnGroups)

router.post(
  '/requests/invite',
  verifyToken,
  validation.inviteGroup,
  controller.createManyRequests
)

router
  .route('/requests')
  .post(verifyToken, controller.createSingleRequest)
  .get(verifyToken, controller.getAllRequestsOfUser)

router
  .route('/requests/:id')
  .put(
    verifyToken,
    // validation.inviteGroup,
    controller.updateRequest
  )
  .delete(verifyToken, controller.deleteRequest)

router.get('/:id', verifyToken, controller.getGroup)
router.get('/:id/pending-posts', verifyToken, controller.getPendingPosts)
router.get('/:id/files', verifyToken, controller.getAllFilesOfGroup)

router.put('/:id/decline-post', verifyToken, controller.declinePosts)
router.put('/:id/approve-post', verifyToken, controller.approvePosts)

export default router
