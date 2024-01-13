// script.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

prisma.$on('beforeDelete', async ({ model, where }) => {
  if (model === 'Post') {
    const deletedPost = await prisma.post.findUnique({ where })
    console.log(`Post deleted: ${deletedPost.title}`)
    // You can perform additional actions here
  }
})
