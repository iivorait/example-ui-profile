import { ActionCreator } from 'redux';

import { User, ClientEvent, Client } from '..';

type Action = { type: string; payload?: User | undefined | Client };
export const CONNECTED_ACTION = 'CONNECTED_ACTION';

export const connected = (client: Client): Action => {
  return {
    type: CONNECTED_ACTION,
    payload: client,
  };
};

export const authorized = (user: User): Action => {
  return {
    type: ClientEvent.AUTHORIZED,
    payload: user,
  };
};

export const unauthorized = (): Action => {
  return {
    type: ClientEvent.UNAUTHORIZED,
  };
};
