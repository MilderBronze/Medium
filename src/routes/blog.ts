import { Hono } from "hono";
import { verify } from "hono/jwt";
import { getPrisma } from "..";
import z, { string } from 'zod'

type Bindings = {
    DATABASE_URL: string
    SECRET_KEY: string
}

interface jwtPayload { id: string; email: string }

type Variables = {
    jwtPayload?: jwtPayload;
};
export const blogRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// the goal here is.. to pass in only the user modified values..
const removeUndefined = <T extends object>(obj: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
    ) as Partial<T>
}

blogRouter.use('/*', async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) return c.json({ success: false, message: 'No Authorization header' }, 401);
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return c.json({ success: false, message: 'Invalid Authorization header format' }, 401);
        }
        const token = parts[1].trim();
        const tokenData = await verify(token, c.env.SECRET_KEY);
        // if verify throws, then catch block already handles it..

        // else token is a success..
        const { id, email } = tokenData;
        c.set('jwtPayload', { id, email });
        await next();

    } catch (error) {
        return c.json({
            success: false,
            message: "token is invalid",
            error: error
        })
    }


})

// 1. get all posts
blogRouter.get('/bulk', async (c) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL)
        const page = Number(c.req.query("page")) || 1;
        const pageSize = 50;
        // --- Total blogs count for pagination info ---
        const totalBlogs = await prisma.blog.count();
        const totalPages = Math.ceil(totalBlogs / pageSize);
        const blogs = await prisma.blog.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: { author: true },
            orderBy: { createdAt: 'desc' }
        });
        return c.json({
            success: true,
            message: "all blogs retrieved",
            blogs,
            pagination: {
                page,
                pageSize,
                totalBlogs,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, 200)
    } catch (error) {
        return c.json({
            success: false,
            message: "blogs failed to be retrieved"
        }, 500)
    }
})


// 2. upload a post
blogRouter.post('/', async (c) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL)
        const { title, content } = await c.req.json();
        const user = c.get('jwtPayload');
        if (!user) {
            return c.json({
                success: false,
                message: "jwtPayload didnt have user email/id"
            }, 404)
        }
        const blogSchema = z.object({
            title: z.string(),
            content: z.string(),
            authorId: z.number()
        })
        const validatedData = blogSchema.parse({
            title: title,
            content: content,
            authorId: parseInt(user.id)
        })
        const blog = await prisma.blog.create({
            data: validatedData
        })
        return c.json({
            message: "blog creation success",
            blog: blog,
            blogId: blog.id,
            success: true,
        }, 200)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                message: "input validation failed",
                success: false,
                error: error.errors
            })
        }
        return c.json({
            message: "blog not created",
            success: false,
            error: error
        })
    }
})


// 3. get a specific post
blogRouter.get('/:id', async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL)
    try {

        const blogId = Number(c.req.param("id"))
        const idSchema = z.number().int().positive();
        const validatedId = idSchema.parse(blogId);
        const blog = await prisma.blog.findUnique({
            where: {
                id: validatedId
            }
        })
        if (!blog) {
            return c.json({
                message: "couldn't fetch blog",
                success: false
            }, 404)
        }
        return c.json({
            message: "blog retrieval success",
            success: true,
            blog
        }, 200)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                message: "zod validation for id of blog failed",
                success: false,
                error: error.errors
            }, 400)
        }
        return c.json({
            message: "couldn't fetch blog",
            success: false,
            error
        }, 500)
    }
})

blogRouter.put('/:id', async (c) => {
    try {
        const blogUpdateSchema = z.object({
            title: z.string().optional(),
            content: z.string().optional()
        })

        const prisma = getPrisma(c.env.DATABASE_URL)
        const { title, content } = await c.req.json();
        // values related to blog to be passed in req.body
        const blogId: number = Number(c.req.param("id"));
        if (isNaN(blogId)) {
            return c.json({ message: "Invalid blog ID", success: false });
        }

        const blogFound = await prisma.blog.findUnique({
            where: { id: blogId }
        })
        if (!blogFound) {
            return c.json({
                message: "blog not found",
                success: false
            })
        }

        const verifiedData = blogUpdateSchema.parse({
            title, content
        })
        const data = removeUndefined(verifiedData)

        if (Object.keys(data).length === 0) {
            return c.json({ message: "no fields to update", success: false })
        }

        const blog = await prisma.blog.update({
            where: { id: blogId },
            data: data
        })
        return c.json({
            message: "blog updated",
            success: true,
            blog: blog
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                message: "update request failed due to invalid data input",
                success: false,
                error: error.errors
            })
        }
        return c.json({
            message: "failed to update blog",
            success: false,
            error: error
        })
    }
})
