import { Router } from 'express'

import { postControllers as controller } from '../../controllers'
import { postValidation as validation } from '../../validations'
import { verifyToken } from '../../middlewares'

const router = Router()

router
  .route('/')
  .post(validation.createPost, verifyToken, controller.createPost)

router.get('/home', verifyToken, controller.getHomePosts)
router.get('/hashtags', verifyToken, controller.getAllHashtags)
router.get('/hashtag', verifyToken, controller.getHashtagdPosts)
router.get('/report', verifyToken, controller.getReportedPosts)
router.get('/save', verifyToken, controller.getSavePosts)
router.get('/search', verifyToken, controller.searchPosts)
router.get('/top', verifyToken, controller.getDiscoverPosts)

router.get('/user/:id', verifyToken, controller.getUserPosts)
router.get('/group/feed', verifyToken, controller.groupFeedPosts)

router.get('/group/:id', verifyToken, controller.getGroupPosts)
router
  .route('/:id/react')
  .post(verifyToken, validation.reactPost, controller.reactPost)
  .delete(verifyToken, controller.removeReactPost)

router.route('/:id/save').post(verifyToken, controller.savePost)
router.route('/:id/un-save').post(verifyToken, controller.unsavePost)
router.route('/:id/report').post(verifyToken, controller.createReport)
router.route('/:id/keep').post(verifyToken, controller.keepReportedPost)

router
  .route('/:id')
  .put(verifyToken, controller.updatePost)
  .get(verifyToken, controller.getSinglePost)
  .delete(verifyToken, controller.deletePost)

export default router
