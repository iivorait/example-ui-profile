import React, { FC } from 'react';

import { Client, ClientProps } from '.';
import { useKeycloak } from './keycloak';

export interface KeycloakContextProps {
  readonly userManager: Client;
}

export const KeycloakContext = React.createContext<KeycloakContextProps | null>(
  null
);

export const KeycloakProvider: FC<Partial<ClientProps>> = ({ children }) => {
  const client = useKeycloak();
  return (
    <KeycloakContext.Provider
      value={{
        userManager: client // todo: just 'client'
      }}>
      {children}
    </KeycloakContext.Provider>
  );
};
