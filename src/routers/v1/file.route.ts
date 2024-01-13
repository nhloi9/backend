import { Router } from 'express'

import { fileControllers as controller } from '../../controllers'
import { upload } from '../../utils'
import { verifyToken } from '../../middlewares'

const router = Router()

router
  .route('/')
  .post(verifyToken, upload.single('file'), controller.uploadFile)

router.get('/link-preview', controller.getPreviewLink)
// router.route('/:fileName').delete(verifyToken, isAdmin, controller.deleteFile)

export default router
