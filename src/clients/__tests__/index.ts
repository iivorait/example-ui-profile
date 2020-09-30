import { ReactWrapper } from 'enzyme';
import { Client, ClientProps, setClientConfig } from '..';
import config from '../../config';

export type MockMutator = {
  setClientInitPayload: (resolve: {} | null, reject: {} | null) => void;
  setTokenParsed: (props: {}) => void;
  setUser: (props: {}) => void;
  getInitCallCount: () => number;
  getCreationCount: () => number;
  resetMock: () => void;
  setLoadProfilePayload: (resolve: {} | null, reject: {} | null) => void;
  getLoginCallCount: () => number;
  getLogoutCallCount: () => number;
  setTokens: (newTokens: {}) => {};
  getInstance: () => Keycloak.KeycloakInstance;
  createValidUserData: (props?: {}) => { email: string; session_state: string };
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

describe('File must return one test ', () => {
  it(' and this is just a note:', () => {
    expect(!!'skip').toBeTruthy();
  });
});
