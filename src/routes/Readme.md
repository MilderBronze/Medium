## c (Context):

Main object in Hono route handlers/middleware.
Provides access to:

- c.req: The request object.
- c.env: Environment variables (bindings).
- c.res: The response object (rarely used directly).
- c.json(), c.text(), etc.: Methods to send responses.
- c.get(key), c.set(key, value): Store/retrieve per-request variables.
- c.header(name): Get/set headers.
  ...and more utility methods.

## c.req (Request):

Represents the incoming HTTP request.
Provides access to:

- c.req.header(name): Get a request header.
- c.req.query(name): Get a query parameter.
  - Example URL: `/api/v1/blog/bulk?page=2&somethingelse=hi`  
    Here, `c.req.query("page")` returns `"2"`.
    and `c.req.query("somethingelse")` returns `"hi"`.
- c.req.param(name): Get a route parameter.
  - Example URL: `/api/v1/blog/123`  
    Here, if your route is defined as `/api/v1/blog/:id`, then `c.req.param("id")` returns `"123"`.
- c.req.json(): Parse JSON body.
- c.req.text(): Parse text body.
- c.req.method: HTTP method.
- c.req.url: Full request URL.
  ...other request-specific data.

## Summary:

Use c for context-wide utilities, env, and response helpers.
Use c.req for request-specific data (headers, params, body, etc.).

## c.res

It is the response object in Hono’s context and is rarely used directly, but you can access or modify:

- c.res.status: The HTTP status code.
- c.res.headers: The response headers.
- c.res.body: The response body (if set directly).
- c.res.redirect(url, status?): Redirect to a URL.
- c.res.json(), c.res.text(), etc.: (If using the lower-level API, but usually you use c.json(), c.text() on the context directly.)

## In practice:

You usually use c.json(), c.text(), etc., to send responses, but you can access c.res for advanced use cases (like setting headers or status manually).
