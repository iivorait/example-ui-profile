import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { useSelector } from 'react-redux';
import { useKeycloak, useKeycloakErrorDetection, getClient } from '../keycloak';
import { Client, ClientError, ClientStatus } from '..';
import {
  InstanceIdentifier,
  ClientValues,
  getClientDataFromComponent,
  matchClientDataWithComponent,
  configureClient
} from '../__mocks__';
import { ClientProvider, ClientContext } from '../ClientProvider';
import StoreProvider from '../redux/StoreProvider';
import { StoreState } from '../redux';
import { mockMutatorGetter } from '../__mocks__/keycloak-mock';

const ClientDataRenderer = ({
  client,
  id
}: {
  client: Client;
  id: string;
}): React.ReactElement => {
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

const KeyCloakHookRenderer = ({
  callback,
  id
}: InstanceIdentifier): React.ReactElement => {
  const client = useKeycloak();
  callback({ id, client });
  return <ClientDataRenderer id={id} client={client} />;
};

const KeycloakConsumer = ({
  callback,
  id
}: InstanceIdentifier): React.ReactElement | null => {
  return (
    <ClientContext.Consumer>
      {(value): React.ReactElement | null => {
        const client: Client = (value && value.client) as Client;
        callback({ id, client });
        return <ClientDataRenderer id={id} client={client} />;
      }}
    </ClientContext.Consumer>
  );
};

const KeycloakReduxConsumer = ({ id }: { id: string }): React.ReactElement => {
  const state: StoreState = useSelector((storeState: StoreState) => storeState);
  const { user } = state;
  const { error } = state;
  return (
    <div id={`instance_${id}`}>
      <div className="status">{state.status}</div>
      <div className="authenticated">{String(state.authenticated)}</div>
      <div className="initialized">{String(state.initialized)}</div>
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

describe('Keycloak consumers ', () => {
  let dom: ReactWrapper;
  configureClient();
  const nonHookClient = getClient();
  const mockMutator = mockMutatorGetter();

  const getComponentValues = (selector: string): ClientValues | undefined =>
    getClientDataFromComponent(dom, selector);

  const matchComponentWithClient = (
    selector: string,
    client: Client
  ): ClientValues | undefined =>
    matchClientDataWithComponent(dom, selector, client);

  const getErrorText = (): string => {
    return dom
      .find('#errorRenderer')
      .at(0)
      .find('.error')
      .text();
  };

  const compareComponentWithRedux = (): void => {
    const values = getComponentValues('#redux');
    const user = nonHookClient.getUser();
    const clientEmail = user ? user.email : undefined;
    const errorObj = nonHookClient.getError();
    const error = errorObj ? errorObj.message : undefined;

    expect(values).toEqual({
      status: nonHookClient.getStatus(),
      authenticated: nonHookClient.isAuthenticated(),
      initialized: nonHookClient.isInitialized(),
      error,
      email: clientEmail
    });
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
      <ClientProvider>
        <StoreProvider>
          <div>
            <KeyCloakHookRenderer callback={callback} id="1" />
            <KeyCloakHookRenderer callback={callback} id="2" />
            <KeyCloakHookRenderer callback={callback} id="3" />
            <KeyCloakErrorHookRenderer />
            <KeycloakConsumer callback={callback} id="consumer" />
            <KeycloakReduxConsumer id="redux" />
          </div>
        </StoreProvider>
      </ClientProvider>
    );
  };
  beforeAll(async () => {
    mountDom();
    await act(async () => {
      await nonHookClient.init();
    });
  });
  beforeEach(async () => {
    await act(async () => {
      mockMutator.resetMock();
      nonHookClient.setError(undefined);
      mockMutator.setUser();
      nonHookClient.onAuthChange(false);
    });
    dom.update();
  });
  afterEach(() => {
    nonHookClient.clearSession();
  });
  describe('have same instance ', () => {
    it('with same values', async () => {
      dom.update();
      expect(instances.size).toBe(4);
      expect((instances.get('1') as Client).getStatus()).toBe(
        ClientStatus.UNAUTHORIZED
      );
      expect(instances.get('1') === instances.get('2')).toBe(true);
      expect(instances.get('2') === instances.get('3')).toBe(true);
      expect(instances.get('3') === instances.get('consumer')).toBe(true);
      expect(nonHookClient === instances.get('1')).toBe(true);
    });
  });
  describe('Components and consumers using useKeycloak ', () => {
    it('are rendered and updated', async () => {
      matchComponentWithClient('#instance_1', instances.get('3') as Client);
      matchComponentWithClient('#instance_2', instances.get('1') as Client);
      matchComponentWithClient('#instance_3', instances.get('2') as Client);
      matchComponentWithClient('#consumer', nonHookClient);
      const user = mockMutator.createValidUserData({
        email: 'yougot@email.com'
      });
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
      matchComponentWithClient('#consumer', nonHookClient);
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
    it('Redux consumer render client data and updates', async () => {
      const email = 'redux@react.js';
      compareComponentWithRedux();
      act(() => {
        nonHookClient.setError({
          type: ClientError.UNEXPECTED_AUTH_CHANGE,
          message: ClientError.UNEXPECTED_AUTH_CHANGE
        });
        mockMutator.setUser(mockMutator.createValidUserData({ email }));
        nonHookClient.onAuthChange(true);
      });
      dom.update();
      compareComponentWithRedux();
      const values = getComponentValues('#redux');
      expect(values).toBeDefined();
      if (values) {
        expect(values.email).toBe(email);
      }
    });
  });
});
