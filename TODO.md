# Prepare
Get rid of guards and related code in demo and src

# Middleware, Interceptor, Controller

Middleware is attached to Fastify server as hook
it has access to req, res
but not to HandlerContext
it can respond directly with HTTP status and body 

Interceptor is Connectrpc internal thing
it has access to HandlerContext
it has access to headers
but not to raw req, res

Controller receives parsed request object and HandlerContext

0. We create ContextValues implementation that also has `entries()` method to iterate over key-value pairs

1. We create ContextMiddleware. It should be first middleware. It has access to req, res, so it can add custom header "x-server-request-id" to req and create a connectrpc ContextValues in global context store
```TS
req.headers['x-server-request-id'] = generatedRequestId;
MiddlewareContextStore[generatedRequestId] = new ContextValues(); // our implementation
```
When request is finished Middleware can delete the record from MiddlewareContextStore
```TS
res.on('finish', () => {
    delete MiddlewareContextStore[generatedRequestId];
});
```

2. We create ContextInterceptor. It should be first interceptor. It reads "x-server-request-id" header from HandlerContext and obtains contextValues from MiddlewareContextStore and sets it to HandlerContext
```TS
const requestId = handlerContext.requestHeader.get('x-server-request-id');
const contextValues = MiddlewareContextStore[requestId];
for (const [key, value] of contextValues.entries()) {
    handlerContext.values.set(key, value);
}
``` 
*TODO: there might be a problem reading headers because middleware operates on raw request*

3. We pass HandlerContext to Controller methods as connectrpc does

4. Get rid of ManualExecutionContext and ExecutionContext, we use original HandlerContext

5. Add real ContextInterceptor to chain of interceptors in connectrpc because we are going to use more Interceptors later 

6. Remove `req` `res` from MiddlewareContextStore