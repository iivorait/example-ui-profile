import { User, ClientEvent, Client, ClientError, EventPayload } from '../index';

type Action = { type: string; payload?: EventPayload };
export const CONNECTED_ACTION = 'CONNECTED_ACTION';

export const connected = (client: Client): Action => {
  return {
    type: CONNECTED_ACTION,
    payload: client
  };
};

export const authorized = (user: User): Action => {
  return {
    type: ClientEvent.AUTHORIZED,
    payload: user
  };
};

export const unauthorized = (): Action => {
  return {
    type: ClientEvent.UNAUTHORIZED
  };
};

export const errorThrown = (error: ClientError): Action => {
  return {
    type: ClientEvent.ERROR,
    payload: error
  };
};
