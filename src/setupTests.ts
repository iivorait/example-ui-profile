/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import Adapter from 'enzyme-adapter-react-16';
import { configure } from 'enzyme';
// eslint-disable-next-line import/no-extraneous-dependencies
import { GlobalWithFetchMock } from 'jest-fetch-mock';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-localstorage-mock';

const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock;
// eslint-disable-next-line import/no-extraneous-dependencies
customGlobal.fetch = require('jest-fetch-mock');

customGlobal.fetchMock = customGlobal.fetch;

configure({ adapter: new Adapter() });

jest.mock('react-router', () => ({
  ...(jest.requireActual('react-router') as {}),
  useHistory: (): Record<string, Function> => ({
    push: jest.fn()
  })
}));

jest.mock('keycloak-js', () => {
  let clientInitResolvePayload: {} | undefined;
  let clientInitRejectPayload: {} | undefined;
  let loadProfileResolvePayload: {} | undefined;
  let loadProfileRejectPayload: {} | undefined;
  let user: {} = {};
  let tokenParsed: Record<string, unknown> = {};
  let initCallCount = 0;
  let creationCount = 0;
  let loginMock: jest.Mock;
  let logoutMock: jest.Mock;
  const tokens = {
    token: undefined,
    idToken: undefined,
    refreshToken: undefined
  };
  let clientInstance: Keycloak.KeycloakInstance;

  const setClientInitPayload = (
    resolvePayload: {},
    rejectPayload: {}
  ): void => {
    clientInitResolvePayload = resolvePayload;
    clientInitRejectPayload = rejectPayload;
  };
  const setLoadProfilePayload = (
    resolvePayload: {},
    rejectPayload: {}
  ): void => {
    loadProfileResolvePayload = resolvePayload;
    loadProfileRejectPayload = rejectPayload;
  };
  const setTokenParsed = (props: {}): void => {
    tokenParsed = Object.assign(tokenParsed, {
      ...user,
      ...props
    });
  };
  const setUser = (props: {}): void => {
    user = props;
    setTokenParsed({});
  };
  const getInitCallCount = (): number => {
    return initCallCount;
  };
  const getCreationCount = (): number => {
    return creationCount;
  };
  const getLoginCallCount = (): number => {
    return loginMock ? loginMock.mock.calls.length : -1;
  };
  const getLogoutCallCount = (): number => {
    return logoutMock ? logoutMock.mock.calls.length : -1;
  };
  const setTokens = (newTokens: {}): {} => {
    Object.assign(tokens, newTokens);
    return tokens;
  };
  const getInstance = (): Keycloak.KeycloakInstance => {
    return clientInstance;
  };
  const createValidUserData = (props?: {}): {} => {
    return {
      email: 'valid@user.fi',
      // eslint-disable-next-line @typescript-eslint/camelcase
      session_state: '1234567890',
      ...props
    };
  };
  const resetMock = (): void => {
    creationCount = 0;
    initCallCount = 0;
    clientInitResolvePayload = true;
    clientInitRejectPayload = undefined;
    loadProfileResolvePayload = { given_name: 'given_name' };
    loadProfileRejectPayload = undefined;
    loginMock = jest.fn();
    logoutMock = jest.fn();
    Object.keys(tokenParsed).forEach(
      (key: string) => tokenParsed[key] === undefined
    );
    setTokens({
      token: undefined,
      idToken: undefined,
      refreshToken: undefined
    });
  };

  const promiseTimeout = 20;

  return (returnMockMutator: string): Record<any, any> => {
    if (returnMockMutator === 'returnMockMutator') {
      return {
        setClientInitPayload,
        setTokenParsed,
        setUser,
        getInitCallCount,
        getCreationCount,
        resetMock,
        setLoadProfilePayload,
        getLoginCallCount,
        getLogoutCallCount,
        setTokens,
        getInstance,
        createValidUserData
      };
    }
    creationCount += 1;
    clientInstance = {
      ...jest.requireActual('keycloak-js'),
      init(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        initOptions?: Keycloak.KeycloakInitOptions
      ): Keycloak.KeycloakPromise<boolean, Keycloak.KeycloakError> {
        initCallCount += 1;
        return new Promise((resolve: Function, reject: Function) => {
          setTimeout((): void => {
            // eslint-disable-next-line no-unused-expressions
            clientInitRejectPayload
              ? reject(clientInitRejectPayload)
              : resolve(clientInitResolvePayload);
          }, promiseTimeout);
        }) as Keycloak.KeycloakPromise<boolean, Keycloak.KeycloakError>;
      },
      login: (
        options?: Keycloak.KeycloakLoginOptions | undefined
      ): Keycloak.KeycloakPromise<void, void> => {
        loginMock(options);
        return Promise.resolve() as Keycloak.KeycloakPromise<void, void>;
      },
      logout: (
        options?: Keycloak.KeycloakLogoutOptions | undefined
      ): Keycloak.KeycloakPromise<void, void> => {
        logoutMock(options);
        return Promise.resolve() as Keycloak.KeycloakPromise<void, void>;
      },
      loadUserProfile(): Keycloak.KeycloakPromise<
        Keycloak.KeycloakProfile,
        void
      > {
        return new Promise((resolve: Function, reject: Function) => {
          setTimeout((): void => {
            // eslint-disable-next-line no-unused-expressions
            loadProfileRejectPayload
              ? reject(loadProfileRejectPayload)
              : resolve(loadProfileResolvePayload);
          }, promiseTimeout);
        }) as Keycloak.KeycloakPromise<Keycloak.KeycloakProfile, void>;
      },
      tokenParsed,
      get token(): string | undefined {
        return tokens.token;
      },
      get idToken(): string | undefined {
        return tokens.idToken;
      },
      get refreshToken(): string | undefined {
        return tokens.refreshToken;
      }
    };
    return clientInstance;
  };
});
