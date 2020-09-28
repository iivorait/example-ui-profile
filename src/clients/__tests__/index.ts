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

describe('File must return one test ', () => {
  it(' and this is just a note:', () => {
    expect(!!'skip').toBeTruthy();
  });
});
