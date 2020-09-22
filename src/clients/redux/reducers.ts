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
      const initialised = client.isInitialized();
      return {
        ...state,
        user: null,
        status,
        authenticated,
        initialised
      };
    case ClientEvent.USER_EXPIRED:
      return {
        ...state,
        user: null,
        status: ClientStatus.UNAUTHORIZED
      };
    case ClientEvent.ERROR:
      return { ...state };
    case ClientEvent.UNAUTHORIZED:
      return {
        ...state,
        user: null,
        status: ClientStatus.UNAUTHORIZED,
        initialised: true,
        authenticated: false
      };
    case ClientEvent.AUTHORIZED:
      return {
        ...state,
        user: action.payload,
        status: ClientStatus.AUTHORIZED,
        initialised: true,
        authenticated: true
      };
    case ClientEvent.INITIALIZING:
      return {
        ...state,
        status: ClientStatus.INITIALIZING,
        initialised: false
      };
    default:
      return state;
  }
};

export default reducer;
