/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
// following ts-ignore + eslint-disable fixes "Could not find declaration file for module" error for await-handler
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import to from 'await-handler';
import { UserManager } from 'oidc-client';
import {
  EventListeners,
  configureClient,
  createEventListeners
} from '../__mocks__';
import { ClientStatus, Client, ClientEvent, ClientError } from '../index';
import { createOidcClient } from '../oidc-react';
import { mockMutatorGetterOidc } from '../__mocks__/oidc-react-mock';

type UserManagerEvent = {
  raise: (payload?: any) => void;
};

describe('Oidc client ', () => {
  let client: Client;
  configureClient();
  const mockMutator = mockMutatorGetterOidc();
  let eventListeners: EventListeners;
  let instance: UserManager;

  function createNewClient(): Client {
    client = createOidcClient();
    return client;
  }

  function triggerEvent(type: string, payload?: any): void {
    (instance.events as any).trigger(type, payload);
  }

  function initTests(): void {
    mockMutator.resetMock();
    client = createNewClient();
    eventListeners = createEventListeners(client.addListener);
    instance = mockMutator.getInstance() as UserManager;
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

    it('UserUnloaded, UserSignedOut and UserSessionChanged trigger onAuthChange and result in UNAUTHORIZED status ', async () => {
      mockMutator.setUser(mockMutator.createValidUserData());
      await to(client.init());
      ['userUnloaded', 'userSignedOut', 'userSessionChanged'].forEach(
        (eventType: string, index: number) => {
          client.onAuthChange(true);
          expect(client.getStatus()).toBe(ClientStatus.AUTHORIZED);
          expect(eventListeners.getCallCount(ClientEvent.AUTHORIZED)).toBe(
            index + 1
          );
          expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(
            index
          );
          triggerEvent(eventType);
          expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);
          expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(
            index + 1
          );
        }
      );
    });
    it('UserUnloaded, UserSignedOut and UserSessionChanged trigger onAuthChange and result in UNAUTHORIZED status ', async () => {
      mockMutator.setUser(mockMutator.createValidUserData());
      await to(client.init());
      ['userUnloaded', 'userSignedOut', 'userSessionChanged'].forEach(
        (eventType: string, index: number) => {
          client.onAuthChange(true);
          expect(client.getStatus()).toBe(ClientStatus.AUTHORIZED);
          expect(eventListeners.getCallCount(ClientEvent.AUTHORIZED)).toBe(
            index + 1
          );
          expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(
            index
          );
          triggerEvent(eventType);
          expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);
          expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(
            index + 1
          );
        }
      );
    });
    it('SilentRenewError triggers an error of type AUTH_REFRESH_ERROR', async () => {
      const error = new Error('silentRenewError');
      expect(eventListeners.getCallCount(ClientEvent.ERROR)).toBe(0);
      triggerEvent('silentRenewError', error);
      expect(eventListeners.getCallCount(ClientEvent.ERROR)).toBe(1);
      const errorPayload: any = eventListeners.getLastCallPayload(
        ClientEvent.ERROR
      );
      expect(errorPayload).toBeDefined();
      if (errorPayload) {
        expect(errorPayload.type).toBe(ClientError.AUTH_REFRESH_ERROR);
        expect(errorPayload.message).toBe(error.message);
      }
    });
    it('AccessTokenExpired triggers TOKEN_EXPIRED event', async () => {
      expect(eventListeners.getCallCount(ClientEvent.TOKEN_EXPIRED)).toBe(0);
      triggerEvent('accessTokenExpired');
      expect(eventListeners.getCallCount(ClientEvent.TOKEN_EXPIRED)).toBe(1);
    });
    it('AccessTokenExpiring triggers TOKEN_EXPIRED event', async () => {
      expect(eventListeners.getCallCount(ClientEvent.TOKEN_EXPIRING)).toBe(0);
      triggerEvent('accessTokenExpiring');
      expect(eventListeners.getCallCount(ClientEvent.TOKEN_EXPIRING)).toBe(1);
    });
    it('userLoaded triggers CLIENT_AUTH_SUCCESS event', async () => {
      expect(eventListeners.getCallCount(ClientEvent.CLIENT_AUTH_SUCCESS)).toBe(
        0
      );
      triggerEvent('userLoaded');
      expect(eventListeners.getCallCount(ClientEvent.CLIENT_AUTH_SUCCESS)).toBe(
        1
      );
    });
  });
  describe('handleCallback works like init()  ', () => {
    beforeEach(() => {
      initTests();
    });
    afterEach(() => {
      clearTests();
    });

    it('and returns always same promise and can be called multiple times ', async () => {
      expect(client.getStatus()).toBe(ClientStatus.NONE);
      const promise1 = client.handleCallback();
      expect(client.getStatus()).toBe(ClientStatus.INITIALIZING);
      expect(eventListeners.getCallCount(ClientEvent.STATUS_CHANGE)).toBe(1);
      const promise2 = client.handleCallback();
      await to(promise2);
      expect(promise1 === promise2).toBe(true);
      expect(mockMutator.getInitCallCount()).toBe(1);
      expect(mockMutator.getCreationCount()).toBe(1);
      expect(client.getStatus()).toBe(ClientStatus.AUTHORIZED);
      expect(eventListeners.getCallCount(ClientEvent.STATUS_CHANGE)).toBe(2);
      expect(eventListeners.getCallCount(ClientEvent.AUTHORIZED)).toBe(1);
      expect(eventListeners.getCallCount(ClientEvent.UNAUTHORIZED)).toBe(0);
    });
    it('failure results in UNAUTHORIZED status', async () => {
      expect(client.getStatus()).toBe(ClientStatus.NONE);
      mockMutator.setClientInitPayload(undefined, { error: 1 });
      await to(client.handleCallback());
      expect(client.getStatus()).toBe(ClientStatus.UNAUTHORIZED);
      expect(eventListeners.getCallCount(ClientEvent.ERROR)).toBe(1);
      const error: ClientError = (eventListeners.getLastCallPayload(
        ClientEvent.ERROR
      ) as unknown) as ClientError;
      expect(error).toBeDefined();
      if (error) {
        expect(error.type).toBe(ClientError.AUTH_ERROR);
      }
    });
  });
});
