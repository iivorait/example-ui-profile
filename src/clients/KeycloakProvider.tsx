import React, { FC, useState, useEffect, useRef } from 'react';

import {
  createClient,
  KeycloakContextProps,
  KeycloakProviderProps,
} from './keycloak';
import { ClientStatus, Client } from '.';

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
  const [userData, setUserData] = useState<any>(null);
  const [status, setStatus] = useState<ClientStatus>('none');
  const clientRef: React.Ref<Client> = useRef(createClient({}));
  const client: Client = clientRef.current as Client;
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      const user = await client.init();
      console.log('inititiated');
      setStatus(client.getStatus());
      return;
    };
    initClient();
  }, [client]);

  return (
    <KeycloakContext.Provider
      value={{
        signIn: async (args: unknown): Promise<void> => {
          await client.login();
        },
        signOut: async (): Promise<void> => {
          await client.logout();
        },
        signOutRedirect: async (args?: unknown): Promise<void> => {
          await client.logout(); // change
        },
        userData,
        status,
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
};
