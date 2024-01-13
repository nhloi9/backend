import { Router } from 'express'

import { notifyControllers as controller } from '../../controllers'
// import { storyValidation as validation } from '../../validations'
import { verifyToken } from '../../middlewares'

const router = Router()

router.get('/', verifyToken, controller.getNotifies)
router.put('/:id/read', verifyToken, controller.readNotify)

export default router
