/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  UserManager,
  UserManagerSettings,
  User,
  UserManagerEvents
} from 'oidc-client';
import { mockMutatorCreator, MockMutator } from './index';

let oidcReactMutator: MockMutator;

// imports in setUpTests.ts require "mock" prefix, therefore getMockMutator would be invalid
export const mockMutatorGetterOidc = (): MockMutator => {
  if (!oidcReactMutator) {
    oidcReactMutator = mockMutatorCreator();
  }
  return oidcReactMutator;
};

const mockUserManagerEvents = (): UserManagerEvents => {
  const listeners: Map<string, Function[]> = new Map();
  const addListener = (type: string, callback: Function): void => {
    if (!listeners.has(type)) {
      listeners.set(type, []);
    }
    const list = listeners.get(type);
    if (list) {
      list.push(callback);
    }
  };
  const trigger = (type: string, payload?: any): void => {
    if (!listeners.has(type)) {
      return;
    }
    const list = listeners.get(type);
    if (list) {
      list.forEach(callback => callback(payload));
    }
  };
  return {
    load: (): any => true,
    unload: (): any => true,
    addUserUnloaded: (callback: Function): void => {
      addListener('userUnloaded', callback);
    },
    addUserSignedOut: (callback: Function): void => {
      addListener('userSignedOut', callback);
    },
    addUserSessionChanged: (callback: Function): void => {
      addListener('userSessionChanged', callback);
    },
    addSilentRenewError: (callback: Function): void => {
      addListener('silentRenewError', callback);
    },
    addAccessTokenExpired: (callback: Function): void => {
      addListener('accessTokenExpired', callback);
    },
    addUserLoaded: (callback: Function): void => {
      addListener('userLoaded', callback);
    },
    addAccessTokenExpiring: (callback: Function): void => {
      addListener('accessTokenExpiring', callback);
    },
    removeUserLoaded: (): any => true,
    removeUserUnloaded: (): any => true,
    removeSilentRenewError: (): any => true,
    removeUserSignedOut: (): any => true,
    removeAccessTokenExpired: (): any => true,
    removeAccessTokenExpiring: (): any => true,
    removeUserSessionChanged: (): any => true,
    trigger
  } as UserManagerEvents;
};

export const mockOidcUserManager = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings: UserManagerSettings
): Partial<UserManager> => {
  const mockMutator = mockMutatorGetterOidc();
  mockMutator.clientCreated();
  const initPromiseF = (): Promise<User> => {
    mockMutator.initCalled();
    const clientInitRejectPayload = mockMutator.getClientInitRejectPayload();
    return new Promise((resolve: Function, reject: Function) => {
      setTimeout((): void => {
        const profile = mockMutator.getTokenParsed();
        // eslint-disable-next-line no-unused-expressions
        clientInitRejectPayload
          ? reject(clientInitRejectPayload)
          : resolve({
              profile,
              session_state: mockMutator.getTokenParsed().session_state
            });
      }, mockMutator.promiseTimeout);
    }) as Promise<any>;
  };
  return {
    signinSilent(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initOptions?: UserManagerSettings
    ): Promise<any> {
      return initPromiseF();
    },
    signinRedirect: (args?: any): Promise<void> => {
      mockMutator.loginCalled(args);
      return Promise.resolve();
    },
    signoutRedirect: (args?: any): Promise<void> => {
      mockMutator.logoutCalled(args);
      mockMutator.setUser();
      return Promise.resolve();
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signinRedirectCallback: (url?: any): Promise<User> => {
      return initPromiseF();
    },
    getUser: (): Promise<User> => {
      const loadProfileRejectPayload = mockMutator.getLoadProfileRejectPayload();
      const loadProfileResolvePayload = mockMutator.getLoadProfileResolvePayload();
      return new Promise((resolve: Function, reject: Function) => {
        setTimeout((): void => {
          // eslint-disable-next-line no-unused-expressions
          loadProfileRejectPayload
            ? reject(loadProfileRejectPayload)
            : resolve(loadProfileResolvePayload);
        }, mockMutator.promiseTimeout);
      }) as Promise<any>;
    },
    events: mockUserManagerEvents()
  };
};
