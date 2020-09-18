import React, { FC } from 'react';

import { Client } from '.';
import { useKeycloak, KeycloakProps } from './keycloak';

export const KeycloakContext = React.createContext<KeycloakContextProps | null>(
  null
);

export interface KeycloakContextProps {
  readonly userManager: Client;
}

export const KeycloakProvider: FC<KeycloakProps> = ({
  clientId,
  realm,
  url,
  children,
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
