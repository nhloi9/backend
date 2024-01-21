import { Router } from 'express'
import { checkAdmin, verifyToken } from '../../middlewares'
import { statisticControllers as controller } from '../../controllers'

const router = Router()

router.get('/', verifyToken, checkAdmin, controller.statistic)

export default router
