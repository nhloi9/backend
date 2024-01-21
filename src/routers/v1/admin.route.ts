import { Router } from 'express'

import {
  userControllers as controller,
  userControllers
} from '../../controllers'
import { checkAdmin, verifyToken } from '../../middlewares'

const router = Router()

router.get('/all-users', verifyToken, checkAdmin, userControllers.getAllUsers)

export default router
