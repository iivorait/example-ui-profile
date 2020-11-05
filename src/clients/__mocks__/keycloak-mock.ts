import Keycloak from 'keycloak-js';
import { mockMutatorCreator, MockMutator } from './index';

let keyCloakMutator: MockMutator;

// imports in setUpTests.ts require "mock" prefix, therefore getMockMutator would be invalid
export const mockMutatorGetter = (): MockMutator => {
  if (!keyCloakMutator) {
    keyCloakMutator = mockMutatorCreator();
  }
  return keyCloakMutator;
};

export const mockKeycloak = (
  kc: Keycloak.KeycloakInstance,
  mockMutator: MockMutator
): Keycloak.KeycloakInstance => {
  mockMutator.clientCreated();
  const partialMock = {
    ...kc,
    ...{
      init(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        initOptions?: Keycloak.KeycloakInitOptions
      ): Keycloak.KeycloakPromise<boolean, Keycloak.KeycloakError> {
        mockMutator.initCalled();
        const clientInitRejectPayload = mockMutator.getClientInitRejectPayload();
        const clientInitResolvePayload = mockMutator.getClientInitResolvePayload();
        return new Promise((resolve: Function, reject: Function) => {
          setTimeout((): void => {
            // eslint-disable-next-line no-unused-expressions
            clientInitRejectPayload
              ? reject(clientInitRejectPayload)
              : resolve(clientInitResolvePayload);
          }, mockMutator.promiseTimeout);
        }) as Keycloak.KeycloakPromise<boolean, Keycloak.KeycloakError>;
      },
      login: (
        options?: Keycloak.KeycloakLoginOptions | undefined
      ): Keycloak.KeycloakPromise<void, void> => {
        mockMutator.loginCalled(options);
        return Promise.resolve() as Keycloak.KeycloakPromise<void, void>;
      },
      logout: (
        options?: Keycloak.KeycloakLogoutOptions | undefined
      ): Keycloak.KeycloakPromise<void, void> => {
        mockMutator.logoutCalled(options);
        mockMutator.setUser();
        return Promise.resolve() as Keycloak.KeycloakPromise<void, void>;
      },
      loadUserProfile(): Keycloak.KeycloakPromise<
        Keycloak.KeycloakProfile,
        void
      > {
        const loadProfileRejectPayload = mockMutator.getLoadProfileRejectPayload();
        const loadProfileResolvePayload = mockMutator.getLoadProfileResolvePayload();
        return new Promise((resolve: Function, reject: Function) => {
          setTimeout((): void => {
            // eslint-disable-next-line no-unused-expressions
            loadProfileRejectPayload
              ? reject(loadProfileRejectPayload)
              : resolve(loadProfileResolvePayload);
          }, mockMutator.promiseTimeout);
        }) as Keycloak.KeycloakPromise<Keycloak.KeycloakProfile, void>;
      }
    }
  };

  const defineMockProperty = (name: string): void => {
    Object.defineProperty(partialMock, name, {
      configurable: false,
      enumerable: true,
      get() {
        const value =
          name === 'tokenParsed'
            ? mockMutator.getTokenParsed()
            : Reflect.get(mockMutator.getTokens(), name);
        return value;
      },
      set(value) {
        // eslint-disable-next-line no-unused-expressions
        name === 'tokenParsed'
          ? mockMutator.setTokenParsed(value)
          : mockMutator.setTokens({
              [name]: value
            });
      }
    });
  };

  defineMockProperty('token');
  defineMockProperty('idToken');
  defineMockProperty('refreshToken');
  defineMockProperty('tokenParsed');
  return partialMock;
};
