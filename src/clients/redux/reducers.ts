/* eslint-disable no-case-declarations */
import { Reducer } from 'redux';
import { ClientEvent, ClientStatus, Client } from '../index';
import { StoreState } from './index';
import { CONNECTED_ACTION } from './actions';

const reducer: Reducer = (state, action): StoreState => {
  switch (action.type) {
    case CONNECTED_ACTION:
      const client: Client = action.payload;
      const status = client.getStatus();
      const authenticated = client.isAuthenticated();
      const initialized = client.isInitialized();
      return {
        ...state,
        user: undefined,
        status,
        authenticated,
        initialized
      };
    case ClientEvent.TOKEN_EXPIRED:
      return {
        ...state,
        user: undefined,
        status: ClientStatus.UNAUTHORIZED
      };
    case ClientEvent.ERROR:
      return { ...state, error: action.payload };
    case ClientEvent.UNAUTHORIZED:
      return {
        ...state,
        user: undefined,
        status: ClientStatus.UNAUTHORIZED,
        initialized: true,
        authenticated: false
      };
    case ClientEvent.AUTHORIZED:
      return {
        ...state,
        user: action.payload,
        status: ClientStatus.AUTHORIZED,
        initialized: true,
        authenticated: true
      };
    case ClientEvent.INITIALIZING:
      return {
        ...state,
        status: ClientStatus.INITIALIZING,
        initialized: false
      };
    default:
      return state;
  }
};

export default reducer;
