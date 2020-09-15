import React, { FC } from 'react';

import {
  KeycloakContextProps,
  KeycloakProviderProps,
  useKeycloak,
} from './keycloak';

export const KeycloakContext = React.createContext<KeycloakContextProps | null>(
  null
);

export const KeycloakProvider: FC<KeycloakProviderProps> = ({
  clientId,
  realm,
  url,
  children,
  onSignIn,
  onSignOut,
  onBeforeSignIn,
  ...props
}) => {
  const client = useKeycloak();
  console.log('KeycloakProvider render');
  return (
    <KeycloakContext.Provider
      value={{
        userManager: client,
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
};
