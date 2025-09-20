import { Hono } from 'hono'
import { PrismaClient } from './generated/prisma/edge'

import { withAccelerate } from '@prisma/extension-accelerate'
import userRouter from './routes/user'
import { blogRouter } from './routes/blog'


type Bindings = {
  DATABASE_URL: string
  SECRET_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()
app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);

export const getPrisma = (database_url: string) => {
  const prisma = new PrismaClient({
    datasourceUrl: database_url,
  }).$extends(withAccelerate())
  return prisma
}

export default app;
