/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import Adapter from 'enzyme-adapter-react-16';
import { configure } from 'enzyme';
// eslint-disable-next-line import/no-extraneous-dependencies
import { GlobalWithFetchMock } from 'jest-fetch-mock';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-localstorage-mock';
import {
  mockMutatorGetter,
  mockKeycloak
} from './clients/__mocks__/keycloak-mock';

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
  return (): Keycloak.KeycloakInstance => {
    const mock = mockKeycloak();
    const mockMutator = mockMutatorGetter();
    const clientInstance: Keycloak.KeycloakInstance = {
      ...(jest.requireActual('keycloak-js') as {}),
      ...mock
    } as Keycloak.KeycloakInstance;
    mockMutator.setInstance(clientInstance);
    return clientInstance;
  };
});
