# Connectrpc Fastify Wrapper

## Description

This is a wrapper for [Connectrpc](https://github.com/connectrpc/connect-es) using the [Fastify](https://github.com/fastify/fastify) server.

If you are comfortable with HTTP/1 only and want a compact, ready-to-use setup, this repository is for you.

It simplifies the binding of controllers, middlewares, and guards.

I use it as a basis for integration into Nestjs, which will be implemented [here](https://github.com/funduck/connectrpc-fastify-nestjs).


## Features

This library allows you to:
* Use only HTTP/1 transport
* Perform RPC with simple request and response messages
* Perform RPC with streaming responses
* Perform RPC with streaming requests
* Use middlewares
* Use global guards

*Bidirectional streaming RPC is currently out of scope because it requires HTTP/2, which is unstable on public networks. In practice, HTTP/1 provides more consistent performance.*


## Feedback

Please use [Discussions](https://github.com/funduck/connectrpc-fastify/discussions) or email me.