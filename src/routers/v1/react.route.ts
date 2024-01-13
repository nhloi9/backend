import { Router } from 'express'

import { reactControllers as controller } from '../../controllers'

const router = Router()

router.post('/import', controller.importReacts)

export default router
