import * as express from 'express';
import { MAX_STREAM_ID, RSocketClient } from 'rsocket-core';
import RSocketWebSocketClient from 'rsocket-websocket-client';
import { ISubscription, Payload } from '../node_modules/rsocket-types';
import { ReactiveSocket } from 'rsocket-types';
import { Flowable } from 'rsocket-flowable';
const WebSocket = require('ws');

const app = express();
const PORT = 3001;

interface ServerOptions {
  host: string;
  port: number;
}

function make(data: string): Payload<string, string> {
    return {
        data,
        metadata: '',
    };
}

async function connect(options: ServerOptions) {
  console.log(`Client connecting to ${serverOptions.host}:${serverOptions.port}`);
  const client = new RSocketClient<string, string>({
    setup: {
      dataMimeType: 'text/plain',
      keepAlive: 1000000, // avoid sending during test
      lifetime: 100000,
      metadataMimeType: 'text/plain',
    },
    transport: new RSocketWebSocketClient({
      url: 'ws://' + options.host + ':' + options.port,
      wsCreator: url => {
        return new WebSocket(url);
      }
    })
  });
  
  socket = await client.connect();
  socket.connectionStatus().subscribe(status => {
    console.log('Connection status:', status);
    // If there is a problem with connection, uninitialize the socket
    if (status.kind == 'ERROR' || status.kind == 'CLOSED' || status.kind == 'NOT_CONNECTED') {
      socket = undefined;
    }
  });

  return socket;
}

const serverOptions: ServerOptions = {
  host: '0.0.0.0',
  port: 3003
}
// Middleware for connecting to RSocket server
app.use(async (req, res, next) => {
  if (socket == undefined) {
    connect(serverOptions).then(
      _socket => {
        socket = _socket;
        next();
      },
      error => {
        console.error(error);
        res.status = 500;
        res.send(error);
      }
    )
  }
  else {
    next();
  }
})

var socket: ReactiveSocket<string, string>;
app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}...`);
});

app.get("/stream", (req, res) => {
  let subscription: ISubscription;
  let payloads: Payload<string, string>[] = new Array();
  socket.requestStream({
    data: "Hello stream",
    metadata: ''
  }).subscribe({
    onComplete() {
      console.log("onComplete()");
      res.send({ messages: payloads });
    },
    onError(error) {
      console.log('onError(%s)', error.message);
      res.status = 500;
      res.send({ error: error.message });
    },
    onNext(payload: Payload<string, string>) {
      console.log('onNext(%s)', payload.data);
      payloads.push(payload);
    },
    onSubscribe(_subscription: ISubscription) {
      console.log('onSubscribe()');
      subscription = _subscription;
      subscription.request(MAX_STREAM_ID);
    }
  });
})

app.get("/request", (req, res) => {
  socket.requestResponse({
    data: "Hello request/response",
    metadata: ''
  }).then(data => {
    console.log("Request successful");
    console.log(data);

    res.send(data);
  },
  error => {
    console.log(`Request/Response error: ${error}`);
    res.status = 500;
    res.send(error);
  });
});

app.get("/fnf", (req, res) => {
  socket.fireAndForget({
    data: "Hello fnf",
    metadata: ''
  });

  res.send({ messsage: "Sending fnf done!"});
});

app.get("/channel", (req, res) => {
  let subscription: ISubscription;
  let payloads: Payload<string, string> = new Array();
  socket.requestChannel(Flowable.just(make("Hello"), make("channel"))).subscribe({
    onComplete() {
      console.log("onComplete()");
      res.send({ messages: payloads });
    },
    onError(error) {
      console.log('onError(%s)', error.message);
    },
    onNext(payload: Payload<string, string>) {
      console.log('onNext(%s)', payload.data);
      payloads.push(payload);
    },
    onSubscribe(_subscription: ISubscription) {
      console.log('onSubscribe()');
      subscription = _subscription;
      subscription.request(MAX_STREAM_ID);
    }
  });
})