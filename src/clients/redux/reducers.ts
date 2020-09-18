import { Reducer } from 'redux';

import { ClientEvent, ClientStatus, Client } from '../index';
import { StoreState } from './store';
import { CONNECTED_ACTION } from './actions';

export const reducer: Reducer = (state, action): StoreState => {
  console.log('reducer!', action.type);
  switch (action.type) {
    case CONNECTED_ACTION:
      const client: Client = action.payload;
      const status = client.getStatus();
      const authenticated = client.isAuthenticated();
      const initialised = client.isInitialized();
      return Object.assign(
        {},
        { ...state },
        { user: null, status, authenticated, initialised }
      );
    case ClientEvent.USER_EXPIRED:
      return Object.assign(
        {},
        { ...state },
        { user: null, status: ClientStatus.UNAUTHORIZED }
      );
    case ClientEvent.ERROR:
      return Object.assign({}, { ...state });
    case ClientEvent.UNAUTHORIZED:
      return Object.assign(
        {},
        { ...state },
        {
          user: null,
          status: ClientStatus.UNAUTHORIZED,
          initialised: true,
          authenticated: false,
        }
      );
    case ClientEvent.AUTHORIZED:
      return Object.assign(
        {},
        { ...state },
        {
          user: action.payload,
          status: ClientStatus.AUTHORIZED,
          initialised: true,
          authenticated: true,
        }
      );
    case ClientEvent.INITIALIZING:
      return Object.assign(
        {},
        { ...state },
        { status: ClientStatus.INITIALIZING, initialised: false }
      );
    default:
      return state;
  }
};
