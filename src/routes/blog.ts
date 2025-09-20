import { Hono } from "hono";
import { decode, jwt, verify } from "hono/jwt";

type Bindings = {
    DATABASE_URL: string
    SECRET_KEY: string
}
interface jwtPayload { id: string; email: string }

type Variables = {
    jwtPayload?: jwtPayload;
};
export const blogRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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
blogRouter.get('/bulk', (c) => {

})


// 2. upload a post
blogRouter.post('/', (c) => {

})


// 3. get a specific post
blogRouter.get('/:id', (c) => {

})

// 4. update a blog
blogRouter.get('', (c) => {

})

