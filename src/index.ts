import { Hono } from 'hono'
// import { PrismaClient } from './generated/prisma/client'
import { PrismaClient } from './generated/prisma/edge'
// import { PrismaClient } from '@prisma/client'
import z from 'zod'

import { withAccelerate } from '@prisma/extension-accelerate'
import { sha256 } from 'hono/utils/crypto'
// import { User, Blog } from './generated/prisma' // iska zarurat nai padega


type Bindings = {
  DATABASE_URL: string
  SECRET_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

export const getPrisma = (database_url: string) => {
  const prisma = new PrismaClient({
    datasourceUrl: database_url,
  }).$extends(withAccelerate())
  return prisma
}

// routes to make:

app.get('/', (c) => c.text('Hello Cloudflare Workers!'))


// 1. get all posts
app.get('/api/v1/blog/bulk', (c) => {

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
app.post('/api/v1/user/signup', async (c) => {
  // for future:
  // receive user credentials from req.body
  // validate if user already present agains the db -> yes: throw error -> no: {check if user email legit (send an otp to his email) -> user enters otp within the 5 mins window and verifies himself -> yes: (create his account, generate jwt, store it in his browser, redirect to dashboard) -> no: redirect back to the signin route


  // for now:
  // receive user credentials from req.body
  // if user exists... throw
  // else create account
  const prisma = getPrisma(c.env.DATABASE_URL)

  const { email, password } = await c.req.json();
  try {
    const userFound = await prisma.user.findFirst({
      where: { email }
    });
    if (userFound) {
      return c.json({
        Message: "User already exists!",
      }, 411);
    }

    const hashedPassword = await sha256(password) as string

    // add zod validation here.
    const User = z.object({
      name: z.string().optional(),
      email: z.string().email(),
      password: z.string()
    });

    // some untrusted data...
    const input = {
      email: email,
      password: hashedPassword
    };

    // the parsed result is validated and type safe!
    const data = User.parse(input);
    const userCreatedSuccessfully = await prisma.user.create({
      data
    })
    return c.json({
      success: true,
      user: userCreatedSuccessfully
    })
  } catch (error) {
    return c.json({
      error: error,
      success: false,
      message: "internal server error"
    }, 500)
  }
})

// 6. signin route
app.post('/api/v1/user/signin', (c) => {

})




export default app
