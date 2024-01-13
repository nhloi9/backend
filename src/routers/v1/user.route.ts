import { Router } from 'express'

import { userControllers as controller } from '../../controllers'
import { userValidation as validation } from '../../validations'
import { verifyToken } from '../../middlewares'

const router = Router()

router
  .route('/register')
  .post(validation.registerUser, controller.registerUser)
  .get(verifyToken, validation.getUser, controller.getUser)

router.get('/active-acount/:ciphertext', controller.activeAcount)
router.get('/', verifyToken, controller.getUser)
router.get('/info/:id', verifyToken, controller.getUserInfo)
router.post('/login', controller.login)
router.get('/google/url', controller.getOauthUrl)
router.get('/google/callback', controller.getOauthToken)
router.get('/logout', controller.logout)
router.put(
  '/avatar',
  verifyToken,
  validation.updateUserAvatar,
  controller.updateAvatar
)
router.put(
  '/cover-image',
  verifyToken,
  validation.updateUserCoverImage,
  controller.updateCoverImage
)
router.put(
  '/profile',
  verifyToken,
  validation.updateUserProfile,
  controller.updateProfile
)

router.post(
  '/forget-password',
  validation.forgetPassword,
  controller.forgetPassword
)

router.post(
  '/verify-reset-password',
  validation.verifyResetPassword,
  controller.verifyResetPassword
)

router.post(
  '/reset-password',
  validation.resetPassword,
  controller.resetPassword
)

router.put(
  '/password',
  validation.changePassword,
  verifyToken,
  controller.changePassword
)

router.put(
  '/password/set',
  validation.setPassword,
  verifyToken,
  controller.setPassword
)

router.get('/search', validation.searchUser, verifyToken, controller.search)
router.get('/:id/files', verifyToken, controller.getAllFilesOfUser)
router.get('/:id/stories', verifyToken, controller.getAllStoriesOfUser)

export default router
