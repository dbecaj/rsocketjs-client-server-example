# RSocketjs client server node applications
This is an example project that demonstrates the use of RSocket in a node application for communication. 
Project is sepereated into `client` and `server` node application.

## Running the example
Procedure for running the application is the same for both `client` and `server`.

`>npm run build` to compile Typescript code to Javascript which resides in the created `dist` folder.

`>npm run start` to start the built application.

You need to run both the `client` and `server` node application to test out RSocket.

### URL for testing different communication types
* Request/Response `localhost:3001/request`
* Stream `localhost:3001/stream`
* Fire and Forget `localhost:3001/fnf`
* Channel `localhost:3001/channel`
