import { Hono } from "hono";
import { getPrisma } from "..";
import { sha256 } from "hono/utils/crypto";
import z from 'zod'
import { sign } from "hono/jwt";
import { SigninInput, SignupInput } from "@milderbronze/medium";


type Bindings = {
    DATABASE_URL: string
    SECRET_KEY: string
}

const userRouter = new Hono<{ Bindings: Bindings }>();

// auth routes
// sign up
userRouter.post('/signup', async (c) => {
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
        // add zod validation here.
        // starting by defining the input type expected:


        // untrusted data...
        // wrapping the incoming input in an object..
        const input = {
            email: email,
            password: password
        };

        // the parsed result is validated and type safe!
        const validUser = SignupInput.parse(input);

        const userFound = await prisma.user.findFirst({
            where: { email: validUser.email }
        });
        if (userFound) {
            return c.json({
                Message: "User already exists!",
            }, 411);
        }

        const hashedPassword = await sha256(password) as string

        // updating password in validUser with the hash:
        validUser.password = hashedPassword;


        const userCreatedSuccessfully = await prisma.user.create({
            data: validUser
        })
        // user created successfully, so give him a signed jwt..

        const token = await sign({
            id: userCreatedSuccessfully.id,
            email
        }, c.env.SECRET_KEY)
        return c.json({
            token,
            success: true,
            user: userCreatedSuccessfully
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: "validation failed",
                errors: error.errors
            }, 400)
        }
        return c.json({
            error: error,
            success: false,
            message: "internal server error"
        }, 500)
    }
})

// sign in
userRouter.post('/signin', async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL)

    const { email, password } = await c.req.json();
    try {
        const signinInput = SigninInput.parse({ email, password });

        const userFound = await prisma.user.findFirst({
            where: { email: signinInput.email }
        });
        if (!userFound) {
            return c.json({
                Message: "User does not exist!",
            }, 403);
        }

        // meaning user exists.
        // verify the password
        const inputPasswordHash = await sha256(password);
        if (inputPasswordHash !== userFound.password) {
            return c.json({ message: "Invalid credentials!" }, 401);
        }

        // passwords also match, sign a jwt and give it to the user and let him in
        // inside signup or signin:
        const token = await sign(
            { id: userFound.id, email: userFound.email }, // payload
            c.env.SECRET_KEY
        )

        return c.json({
            success: true,
            message: "signed in successfully!",
            token
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: "input validation failed",
                error: error.errors,
            })
        }
        return c.json({
            error: error,
            success: false,
            message: "internal server error"
        }, 500)
    }
})

export default userRouter

