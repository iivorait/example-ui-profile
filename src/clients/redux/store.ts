import { createStore } from 'redux';

import { Client, ClientEvent, ClientStatus, ClientStatusIds, User } from '../';
import { reducer } from './reducers';
import { authorized, unauthorized } from './actions';

export type StoreState = {
  user: User | undefined;
  status: ClientStatusIds;
  authenticated: boolean;
  initialised: boolean;
  error: { type: string; message: string } | undefined;
};

export const store = createStore(reducer, {
  user: undefined,
  status: ClientStatus.NONE,
  authenticated: false,
  initialised: false,
  error: undefined,
});

export const connectClient = (client: Client): void => {
  client.addListener(ClientEvent.AUTHORIZED, (client, payload) => {
    console.log('client AUTHORIZED event in store', client.getUser());

    store.dispatch(authorized(payload));
  });
  client.addListener(ClientEvent.UNAUTHORIZED, () => {
    console.log('client UNAUTHORIZED event in store');
    store.dispatch(unauthorized());
  });
};
