import * as express from 'express';
import { Single, Flowable } from 'rsocket-flowable';
import { RSocketServer, MAX_STREAM_ID } from 'rsocket-core';
import RSocketWebSocketServer from 'rsocket-websocket-server';
import { Payload, PartialResponder } from '../node_modules/rsocket-types'
import { ISubscription } from 'rsocket-types';

const app = express();
const PORT = 3000;
const RSOCKET_PORT = 3003;

function logRequest(type: string, payload: Payload<string, string>) {
  console.log(`${type} with payload: ${payload.data}, metadata: ${payload.metadata}`);
}

function make(data: string) {
  return {
    data,
    metadata: '',
  };
}

class MessageResponder implements PartialResponder<string, string> {

  fireAndForget(payload: Payload<string, string>): void {
    logRequest('fnf', payload);
  }

  requestResponse(payload: Payload<string, string>): Single<Payload<string, string>> {
    logRequest('requestResponse', payload);
    return Single.of(make("Hello from server"));
  }

  requestStream(payload: Payload<string, string>): Flowable<Payload<string, string>> {
    logRequest('requestStream', payload);
    return Flowable.just(make('Hello '), make('from'), make('server'));
  }

  requestChannel(payloads: Flowable<Payload<string, string>>): Flowable<Payload<string, string>> {
    logRequest("requestChannel", { data: '', metadata: ''});

    payloads.subscribe({
      onComplete: () => {
        console.log("onComplete()");
      },
      onNext: (value: Payload<string, string>) => {
        logRequest("requestChannel", value);
      },
      onError: (error) => {
        console.error("Error with the requestChannel");
        console.error(error);
      },
      onSubscribe: (subscription: ISubscription) => {
        console.log("onSubscribe()");
        subscription.request(MAX_STREAM_ID);
      }
    });

    return Flowable.just(make("Hello"), make("from"), make("server"));
  }

  metadataPush(payload: Payload<string, string>): Single<void> {
    logRequest('metadataPush', payload);
    return Single.error(new Error());
  }
}

var server: RSocketServer<string, string>;
function initServer(host, port) {
  const options = {
    host,
    port,
    payload: "Hello back"
  }

  server = new RSocketServer<string, string>({
    getRequestHandler: socket => {
      return new MessageResponder();
    },
    transport: new RSocketWebSocketServer({
      port: port
    })
  });
  server.start();

  console.log(`Server started on ${options.host}:${options.port}`);
}

app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}...`);

    initServer('0.0.0.0', RSOCKET_PORT);
});
