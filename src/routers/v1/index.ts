import { type RequestHandler, Router } from 'express'

import userRouters from './user.route'
import friendRouters from './friend-request.route'
import fileRouters from './file.route'
import postRouters from './post.route'
import commentRoutes from './comment.route'
import storyRoutes from './story.route'
import reactRoutes from './react.route'
import groupRoutes from './group.route'
import notifyRoutes from './notify.route'
import conversationRoutes from './conversation.route'
import messageRoutes from './message.route '

const router = Router()

router.use((req: any, res: any, next: any) => {
  console.log(
    '----------------------------------------------------------------'
  )
  console.log(
    req.connection.remoteAddress,
    req.connection.remoteAddress,
    req.connection.remotePort,
    req.connection.localAddress,
    req.connection.localPort
  )
  next()
})

router.use('/users', userRouters)
router.use('/friend-requests', friendRouters)
router.use('/files', fileRouters)
router.use('/posts', postRouters)
router.use('/comments', commentRoutes)
router.use('/stories', storyRoutes)
router.use('/groups', groupRoutes)
router.use('/reacts', reactRoutes)
router.use('/notifies', notifyRoutes)
router.use('/conversations', conversationRoutes)
router.use('/messages', messageRoutes)
// router.get('/link-preview', (async (req: any, res: any): Promise<any> => {
//   try {
//     getLinkPreview('https://www.youtube.com/watch?v=wcIGvCz3eKw', {
//       headers: {
//         'Accept-Language': 'en-US,en;q=0.5'
//       }
//     })
//       .then(data => {
//        res.sta
//       })
//       .catch(err => {
//         console.log(err)
//       })
//   } catch (error) {}
// }) as RequestHandler)

export default router
