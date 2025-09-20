import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { User, Post } from './generated/prisma'


type Bindings = {
  DATABASE_URL: string
  SECRET_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// routes to make:

// 1. get all posts
app.get('/api/v1/blog/bulk', (c) => {
  const prisma = new PrismaClient().$extends(withAccelerate())

})


// 2. upload a post
app.post('/api/v1/blog', (c) => {

})


// 3. get a specific post
app.get('/api/v1/blog/:id', (c) => {

})

// 4. update a blog
app.get('/api/v1/blog', (c) => {

})

// auth routes
// 5. signup route
app.post('/api/v1/user/signup', (c) => {
  // receive user credentials from req.body
  // validate if user already present agains the db -> yes: throw error -> no: {check if user email legit (send an otp to his email) -> user enters otp within the 5 mins window and verifies himself -> yes: (create his account, generate jwt, store it in his browser, redirect to dashboard) -> no: redirect back to the signin route
})

// 6. signin route
app.post('/api/v1/user/signin', (c) => {

})




export default app
