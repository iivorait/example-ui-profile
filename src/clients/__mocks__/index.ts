/* eslint-disable @typescript-eslint/camelcase */
import { ReactWrapper } from 'enzyme';
import {
  Client,
  ClientEvent,
  ClientEventId,
  ClientProps,
  setClientConfig,
  Token
} from '..';
import config from '../../config';

export type MockMutator = {
  setClientInitPayload: (
    resolve: {} | undefined,
    reject: {} | undefined
  ) => void;
  getClientInitResolvePayload: () => Payload;
  getClientInitRejectPayload: () => Payload;
  getLoadProfileResolvePayload: () => Payload;
  getLoadProfileRejectPayload: () => Payload;
  getTokenParsed: () => Record<string, unknown>;
  setTokenParsed: (props: {}) => void;
  setUser: (props?: {}) => void;
  getTokens: () => Tokens;
  getInitCallCount: () => number;
  initCalled: () => void;
  getCreationCount: () => number;
  clientCreated: () => void;
  loginCalled: (props?: any) => void;
  logoutCalled: (props?: any) => void;
  resetMock: () => void;
  setLoadProfilePayload: (
    resolve: {} | undefined,
    reject: {} | undefined
  ) => void;
  getLoginCallCount: () => number;
  getLogoutCallCount: () => number;
  setTokens: (newTokens: {}) => {};
  getInstance: () => Keycloak.KeycloakInstance;
  setInstance: (keycloak: Keycloak.KeycloakInstance) => void;
  createValidUserData: (props?: {}) => {
    email: string;
    name: string;
    given_name: string;
    family_name: string;
  };
  promiseTimeout: number;
};

export type InstanceIdentifier = {
  callback: Function;
  client?: Client;
  id: string;
};

export type ClientValues = {
  status: string;
  authenticated: boolean;
  initialized: boolean;
  error: string | undefined;
  email: string | undefined;
};

export type EventListeners = Record<ClientEventId, jest.Mock> & {
  dispose: () => void;
  getLastCallPayload: (eventType: ClientEventId) => {} | undefined;
  getCallCount: (eventType: ClientEventId) => number;
};

type Payload = {} | undefined;
type Tokens = {
  token: Token;
  idToken: Token;
  refreshToken: Token;
};

export const getClientDataFromComponent = (
  dom: ReactWrapper,
  selector: string
): ClientValues | undefined => {
  const component = dom.find(selector).at(0);
  if (!component) {
    return;
  }
  const status = component.find('.status').text();
  const authenticated = component.find('.authenticated').text() === 'true';
  const initialized = component.find('.initialized').text() === 'true';
  const error = component.find('.error').text() || undefined;
  const email = component.find('.email').text() || undefined;
  // eslint-disable-next-line consistent-return
  return {
    status,
    authenticated,
    initialized,
    error,
    email
  };
};

export const matchClientDataWithComponent = (
  dom: ReactWrapper,
  selector: string,
  client: Client
): ClientValues | undefined => {
  const values = getClientDataFromComponent(dom, selector);
  expect(values).toBeDefined();
  const user = client.getUser();
  if (values) {
    expect(values.status).toBe(client.getStatus());
    expect(values.authenticated).toBe(client.isAuthenticated());
    expect(values.initialized).toBe(client.isInitialized());
    expect(values.email).toBe(user ? user.email : undefined);
  }
  return values;
};

export function configureClient(overrides?: ClientProps): ClientProps {
  return setClientConfig({ ...config.client, ...overrides });
}

export function createEventListeners(
  addEventListener: Function
): EventListeners {
  const listeners: Partial<EventListeners> = {};
  const disposers: Function[] = [];
  Object.keys(ClientEvent).forEach((eventType: string): void => {
    const listener = jest.fn();
    listeners[eventType as ClientEventId] = listener;
    disposers.push(addEventListener(eventType, listener));
  });
  const getLastCallPayload = (eventType: ClientEventId): {} | undefined => {
    const listenerMock = listeners[eventType];
    if (!listenerMock || !listenerMock.mock) {
      return undefined;
    }
    const calls = listenerMock.mock.calls[0];
    return calls[calls.length - 1];
  };
  const getCallCount = (eventType: ClientEventId): number => {
    const listenerMock = listeners[eventType];
    if (!listenerMock || !listenerMock.mock) {
      return -1;
    }
    const { calls } = listenerMock.mock;
    return calls ? calls.length : 0;
  };
  return {
    ...(listeners as EventListeners),
    dispose: (): void => {
      disposers.forEach(disposer => disposer());
    },
    getLastCallPayload,
    getCallCount
  };
}

// imports in setUpTests.ts require "mock" prefix, therefore createMockMutator would be invalid
export const mockMutatorCreator = (): MockMutator => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let clientInitResolvePayload: Payload;
  let clientInitRejectPayload: Payload;
  let loadProfileResolvePayload: Payload;
  let loadProfileRejectPayload: Payload;
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
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const setClientInitPayload: MockMutator['setClientInitPayload'] = (
    resolvePayload,
    rejectPayload
  ): void => {
    clientInitResolvePayload = resolvePayload;
    clientInitRejectPayload = rejectPayload;
  };
  const setLoadProfilePayload: MockMutator['setLoadProfilePayload'] = (
    resolvePayload,
    rejectPayload
  ): void => {
    loadProfileResolvePayload = resolvePayload;
    loadProfileRejectPayload = rejectPayload;
  };

  const getClientInitResolvePayload: MockMutator['getClientInitResolvePayload'] = () =>
    clientInitResolvePayload;
  const getClientInitRejectPayload: MockMutator['getClientInitRejectPayload'] = () =>
    clientInitRejectPayload;
  const getLoadProfileResolvePayload: MockMutator['getLoadProfileResolvePayload'] = () =>
    loadProfileResolvePayload;
  const getLoadProfileRejectPayload: MockMutator['getLoadProfileRejectPayload'] = () =>
    loadProfileRejectPayload;

  const setTokenParsed: MockMutator['setTokenParsed'] = (props: {}): void => {
    tokenParsed = Object.assign(tokenParsed, {
      ...user,
      ...props
    });
  };
  const getTokenParsed: MockMutator['getTokenParsed'] = (): Record<
    string,
    unknown
  > => {
    return tokenParsed;
  };
  const createEmptyUser = (): {} => {
    return {
      name: undefined,
      given_name: undefined,
      family_name: undefined,
      email: undefined,
      session_state: `session_state-${Date.now()}`
    };
  };

  const setUser: MockMutator['setUser'] = (props?: {}): void => {
    user = props || createEmptyUser();
    setTokenParsed(user);
  };
  const getInitCallCount: MockMutator['getInitCallCount'] = () => {
    return initCallCount;
  };
  const initCalled: MockMutator['initCalled'] = () => {
    initCallCount += 1;
  };
  const getCreationCount: MockMutator['getCreationCount'] = () => {
    return creationCount;
  };
  const clientCreated: MockMutator['clientCreated'] = () => {
    creationCount += 1;
  };
  const getLoginCallCount: MockMutator['getLoginCallCount'] = () => {
    return loginMock ? loginMock.mock.calls.length : -1;
  };
  const loginCalled: MockMutator['loginCalled'] = () => {
    loginMock();
  };
  const getLogoutCallCount: MockMutator['getLogoutCallCount'] = () => {
    return logoutMock ? logoutMock.mock.calls.length : -1;
  };
  const logoutCalled: MockMutator['logoutCalled'] = () => {
    logoutMock();
  };
  const setTokens: MockMutator['setTokens'] = newTokens => {
    Object.assign(tokens, newTokens);
    return tokens;
  };
  const getTokens: MockMutator['getTokens'] = () => {
    return tokens;
  };
  const getInstance: MockMutator['getInstance'] = () => {
    return clientInstance;
  };
  const setInstance: MockMutator['setInstance'] = instance => {
    clientInstance = instance;
  };
  const createValidUserData: MockMutator['createValidUserData'] = props => {
    return {
      name: 'valid user',
      given_name: 'valid',
      family_name: 'user',
      email: 'valid@user.fi',
      ...props
    };
  };
  const resetMock: MockMutator['resetMock'] = () => {
    creationCount = 0;
    initCallCount = 0;
    clientInitResolvePayload = true;
    clientInitRejectPayload = undefined;
    loadProfileResolvePayload = { given_name: 'given_name' };
    loadProfileRejectPayload = undefined;
    loginMock = jest.fn();
    logoutMock = jest.fn();
    user = {};
    Object.keys(tokenParsed).forEach((key: string) => {
      tokenParsed[key] = undefined;
    });
    setTokens({
      token: undefined,
      idToken: undefined,
      refreshToken: undefined
    });
    tokenParsed.session_state = `session_state-${Date.now()}`;
  };
  return {
    promiseTimeout: 20,
    setClientInitPayload,
    getTokenParsed,
    setTokenParsed,
    setUser,
    getInitCallCount,
    getCreationCount,
    resetMock,
    setLoadProfilePayload,
    getLoginCallCount,
    getLogoutCallCount,
    setTokens,
    getTokens,
    getInstance,
    setInstance,
    createValidUserData,
    initCalled,
    clientCreated,
    getClientInitResolvePayload,
    getClientInitRejectPayload,
    getLoadProfileResolvePayload,
    getLoadProfileRejectPayload,
    logoutCalled,
    loginCalled
  };
};
