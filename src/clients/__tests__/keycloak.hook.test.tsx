import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import MockedKeyCloak from 'keycloak-js';
import { useKeycloak, useKeycloakErrorDetection, getClient } from '../keycloak';
import { Client, ClientError, ClientStatus } from '..';
import { MockMutator } from '.';

type InstanceIdentifier = {
  callback: Function;
  client?: Client;
  id: string;
};
type ClientValues = {
  status: string;
  authenticated: boolean;
  initialized: boolean;
  error: string | undefined;
  email: string | undefined;
};
const KeyCloakHookRenderer = ({
  callback,
  id
}: InstanceIdentifier): React.ReactElement => {
  const client = useKeycloak();
  callback({ id, client });
  const error = client.getError();
  const user = client.getUser();
  return (
    <div id={`instance_${id}`}>
      <div className="status">{client.getStatus()}</div>
      <div className="authenticated">{String(client.isAuthenticated())}</div>
      <div className="initialized">{String(client.isInitialized())}</div>
      <div className="error">{error ? error.message : ''}</div>
      <div className="email">{user ? user.email : ''}</div>
    </div>
  );
};

const KeyCloakErrorHookRenderer = (): React.ReactElement => {
  const error = useKeycloakErrorDetection();
  return (
    <div id="errorRenderer">
      <div className="error">{error ? error.message : ''}</div>
    </div>
  );
};

describe('Keycloak useKeycloak ', () => {
  let dom: ReactWrapper;
  const nonHookClient = getClient({});
  const mockMutator = (MockedKeyCloak(
    'returnMockMutator'
  ) as unknown) as MockMutator;

  const getComponentValues = (selector: string): ClientValues | undefined => {
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
  const matchComponentWithClient = (
    selector: string,
    client: Client
  ): ClientValues | undefined => {
    const values = getComponentValues(selector);
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
  const getErrorText = (): string => {
    return dom
      .find('#errorRenderer')
      .at(0)
      .find('.error')
      .text();
  };

  const instances: Map<string, Client> = new Map();
  const callback = (iid: InstanceIdentifier): void => {
    const { id, client } = iid;
    if (!instances.has(id)) {
      instances.set(id, client as Client);
    }
  };

  const mountDom = (): void => {
    dom = mount(
      <div>
        <KeyCloakHookRenderer callback={callback} id="1" />
        <KeyCloakHookRenderer callback={callback} id="2" />
        <KeyCloakHookRenderer callback={callback} id="3" />
        <KeyCloakErrorHookRenderer />
      </div>
    );
  };
  beforeAll(async () => {
    mountDom();
    await act(async () => {
      await nonHookClient.init();
    });
  });
  beforeEach(() => {
    mockMutator.resetMock();
  });

  it('returns the same instance and updates components', async () => {
    dom.update();
    expect(instances.size).toBe(3);
    expect((instances.get('1') as Client).getStatus()).toBe(
      ClientStatus.UNAUTHORIZED
    );
    expect(instances.get('1') === instances.get('2')).toBe(true);
    expect(instances.get('2') === instances.get('3')).toBe(true);
    expect(nonHookClient === instances.get('1')).toBe(true);
  });

  it('Components are rendered and updated', async () => {
    matchComponentWithClient('#instance_1', instances.get('3') as Client);
    matchComponentWithClient('#instance_2', instances.get('1') as Client);
    matchComponentWithClient('#instance_3', instances.get('2') as Client);
    const user = mockMutator.createValidUserData({ email: 'yougot@email.com' });
    act(() => {
      mockMutator.setUser(user);
      nonHookClient.onAuthChange(true);
    });

    dom.update();
    const values = getComponentValues('#instance_1') as ClientValues;
    expect(values && values.email).toBe(user.email);
    expect((instances.get('3') as Client).getStatus()).toBe(
      ClientStatus.AUTHORIZED
    );
    matchComponentWithClient('#instance_1', instances.get('3') as Client);
    matchComponentWithClient('#instance_2', instances.get('1') as Client);
    matchComponentWithClient('#instance_3', instances.get('2') as Client);
  });

  it('Error hook is triggered and component rendered', async () => {
    expect(getErrorText()).toBe('');
    act(() => {
      nonHookClient.setError({
        type: ClientError.UNEXPECTED_AUTH_CHANGE,
        message: ClientError.UNEXPECTED_AUTH_CHANGE
      });
    });
    dom.update();
    expect(getErrorText()).toBe(ClientError.UNEXPECTED_AUTH_CHANGE);
  });
});
