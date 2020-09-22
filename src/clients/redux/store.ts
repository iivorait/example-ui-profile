import { createStore } from 'redux';

import { Client, ClientEvent, ClientStatus, User } from '../index';
import reducer from './reducers';
import { authorized, unauthorized } from './actions';

export const store = createStore(reducer, {
  user: undefined,
  status: ClientStatus.NONE,
  authenticated: false,
  initialised: false,
  error: undefined
});

export const connectClient = (client: Client): void => {
  client.addListener(ClientEvent.AUTHORIZED, payload => {
    // console.log('client AUTHORIZED event in store', eventClient.getUser());

    store.dispatch(authorized(payload as User));
  });
  client.addListener(ClientEvent.UNAUTHORIZED, () => {
    // console.log('client UNAUTHORIZED event in store');
    store.dispatch(unauthorized());
  });
};
