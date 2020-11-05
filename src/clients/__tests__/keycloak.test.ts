/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
// following ts-ignore + eslint-disable fixes "Could not find declaration file for module" error for await-handler
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import to from 'await-handler';
import {
  EventListeners,
  configureClient,
  createEventListeners
} from '../__mocks__';
import { ClientStatus, Client, ClientEvent, ClientError } from '../index';
import { createKeycloakClient, getUserFromLocalStorage } from '../keycloak';
import { mockMutatorGetter } from '../__mocks__/keycloak-mock';

describe('Keycloak client ', () => {
  let client: Client;
  configureClient();
  const mockMutator = mockMutatorGetter();
  let eventListeners: EventListeners;
  let instance: Keycloak.KeycloakInstance;

  function createNewClient(): Client {
    client = createKeycloakClient();
    return client;
  }

  function initTests(): void {
    mockMutator.resetMock();
    client = createNewClient();
    eventListeners = createEventListeners(client.addListener);
    instance = mockMutator.getInstance() as Keycloak.KeycloakInstance;
  }

  function clearTests(): void {
    eventListeners.dispose();
  }

  describe('event listeners work and ', () => {
    beforeEach(() => {
      initTests();
    });
    afterEach(() => {
      clearTests();
    });
    it('keycloak.onReady() and onAuthSuccess() trigger events', async () => {
      expect(eventListeners.getCallCount(ClientEvent.CLIENT_READY)).toBe(0);
      expect(eventListeners.getCallCount(ClientEvent.CLIENT_AUTH_SUCCESS)).toBe(
        0
      );
      if (instance.onReady) {
        instance.onReady();
      }
      expect(eventListeners.getCallCount(ClientEvent.CLIENT_READY)).toBe(1);
      if (instance.onAuthSuccess) {
        instance.onAuthSuccess();
      }
      expect(eventListeners.getCallCount(ClientEvent.CLIENT_AUTH_SUCCESS)).toBe(
        1
      );
    });
    it('keycloak.onAuthLogout() trigger authChange', async () => {
      const email = 'onReady@foofoo.bar.com';
      mockMutator.setUser(mockMutator.createValidUserData({ email }));
      await to(client.init());
      expect(client.getStatus()).toBe(ClientStatus.AUTHORIZED);
      if (instance.onAuthLogout) {
        instance.onAuthLogout();
      }
      expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);
    });
    it('keycloak.onAuthError() and onAuthRefreshError() set and trigger error', async () => {
      mockMutator.setClientInitPayload(undefined, { error: 1 });
      expect(eventListeners.getCallCount(ClientEvent.ERROR)).toBe(0);
      if (instance.onAuthError) {
        instance.onAuthError({
          error: 'error',
          error_description: 'onAuthError'
        });
      }
      const authError = client.getError();
      expect(authError?.type).toEqual(ClientError.AUTH_ERROR);
      expect(authError?.message).toBe('onAuthError');
      expect(eventListeners.getCallCount(ClientEvent.ERROR)).toBe(1);

      if (instance.onAuthRefreshError) {
        instance.onAuthRefreshError();
      }
      const authRefreshError = client.getError();
      expect(authRefreshError?.type).toEqual(ClientError.AUTH_REFRESH_ERROR);
      expect(eventListeners.getCallCount(ClientEvent.ERROR)).toBe(2);
    });
    it('keycloak.onTokenExpired() triggers TOKEN_EXPIRED event', async () => {
      expect(eventListeners.getCallCount(ClientEvent.TOKEN_EXPIRED)).toBe(0);
      if (instance.onTokenExpired) {
        instance.onTokenExpired();
      }
      expect(eventListeners.getCallCount(ClientEvent.TOKEN_EXPIRED)).toBe(1);
    });
  });
  describe('user data is ', () => {
    beforeEach(() => {
      initTests();
    });
    afterEach(() => {
      clearTests();
    });
    it('stored after login and user is found in local storage and getUserProfile() and getUserTokens', async () => {
      const email = 'authorized@bar.com';
      const keycloakTokens = {
        token: 'accessToken',
        idToken: 'idToken',
        refreshToken: 'refreshToken'
      };
      mockMutator.setUser(mockMutator.createValidUserData({ email }));
      await to(client.init());
      mockMutator.setTokens(keycloakTokens);
      const token = mockMutator.getTokenParsed();
      const storageUser = getUserFromLocalStorage(token);
      expect(storageUser && storageUser.email).toBe(email);
      const user = client.getUserProfile();
      expect(user && user.email).toBe(email);
      const tokens = client.getUserTokens();
      expect(tokens && tokens.accessToken).toBe(keycloakTokens.token);
      expect(tokens && tokens.idToken).toBe(keycloakTokens.idToken);
      expect(tokens && tokens.refreshToken).toBe(keycloakTokens.refreshToken);
    });
    it('cleared when auth status is changed to false', async () => {
      const email = 'authorized@bar.com';
      mockMutator.setUser(mockMutator.createValidUserData({ email }));
      await to(client.init());
      client.onAuthChange(false);
      const token = mockMutator.getTokenParsed();
      const storageUser = getUserFromLocalStorage(token);
      expect(storageUser).toBeUndefined();
      const user = client.getUserProfile();
      expect(user).toBeUndefined();
    });
  });
});
