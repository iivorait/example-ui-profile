import { StoreState } from '..';
import { createKeycloakClient } from '../../keycloak';
import { Client, ClientError, ClientStatus, User } from '../../index';
import { configureClient } from '../../__tests__/index';
import { store, connectClient } from '../store';
import reducer from '../reducers';
import {
  CONNECTED_ACTION,
  errorThrown,
  authorized,
  unauthorized
} from '../actions';

describe('Redux store ', () => {
  let state: StoreState;
  let client: Client;
  configureClient();
  describe('actions', () => {
    beforeEach(() => {
      state = store.getState();
      client = createKeycloakClient();
    });
    it('should return the initial state with unknown action', () => {
      expect(reducer(state, { type: 'FOO' })).toEqual(state);
    });
    it('should reset the store values to client values with CONNECTED_ACTION', () => {
      client.setError({ type: ClientError.AUTH_REFRESH_ERROR, message: 'foo' });
      client.setStatus(ClientStatus.AUTHORIZED);
      const expectedState = {
        ...state,
        status: ClientStatus.AUTHORIZED,
        authenticated: true,
        initialized: true
      };
      expect(
        reducer(state, { type: CONNECTED_ACTION, payload: client })
      ).toEqual(expectedState);
    });
    it('Error action sets error', () => {
      const error: ClientError = {
        type: ClientError.AUTH_REFRESH_ERROR,
        message: 'foo'
      };
      const expectedState = {
        ...state,
        error
      };
      expect(reducer(state, errorThrown(error))).toEqual(expectedState);
    });
    it('authorized action sets status, authorized and user', () => {
      const user: User = {
        email: 'user@foo.bar'
      };
      const expectedState = {
        ...state,
        status: ClientStatus.AUTHORIZED,
        initialized: true,
        authenticated: true,
        user
      };
      expect(reducer(state, authorized(user))).toEqual(expectedState);
    });
    it('unauthorized action sets status, authorized and user', () => {
      const expectedState = {
        ...state,
        status: ClientStatus.UNAUTHORIZED,
        initialized: true,
        authenticated: false,
        user: undefined
      };
      expect(reducer(state, unauthorized())).toEqual(expectedState);
    });
  });
  describe('is connected to the client and ', () => {
    beforeAll(() => {
      client = createKeycloakClient();
      connectClient(client);
    });
    it('onAuthChange changes store', () => {
      reducer(state, unauthorized());
      client.onAuthChange(true);
      const expectedAuthenticatedState = {
        ...state,
        status: ClientStatus.AUTHORIZED,
        initialized: true,
        authenticated: true,
        user: undefined // because client does not have an user
      };
      expect(store.getState()).toEqual(expectedAuthenticatedState);
      client.onAuthChange(false);
      const expectedUnauthenticatedState = {
        ...expectedAuthenticatedState,
        status: ClientStatus.UNAUTHORIZED,
        initialized: true,
        authenticated: false
      };
      expect(store.getState()).toEqual(expectedUnauthenticatedState);
    });
  });
});
