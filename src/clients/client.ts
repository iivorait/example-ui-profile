/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState, useRef } from 'react';
import {
  Client,
  ClientError,
  ClientEvent,
  ClientStatus,
  ClientStatusId,
  ClientType,
  getClientConfig
} from '.';
import { getClient as getKeycloakClient } from './keycloak';
import { getClient as getOidcClient } from './oidc-react';

export function getClient(clientType?: ClientType): Client {
  const type = clientType || getClientConfig().type;
  return type === 'keycloak' ? getKeycloakClient() : getOidcClient();
}

export function useClient(clientType?: ClientType): Client {
  const clientRef: React.Ref<Client> = useRef(getClient(clientType));
  const clientFromRef: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusId>(clientFromRef.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!clientFromRef.isInitialized()) {
        await clientFromRef.getOrLoadUser().catch(e => {
          clientFromRef.setError({
            type: ClientError.INIT_ERROR,
            message: e && e.toString()
          });
        });
      }
    };
    const statusListenerDisposer = clientFromRef.addListener(
      ClientEvent.STATUS_CHANGE,
      status => {
        setStatus(status as ClientStatusId);
      }
    );

    initClient();
    return (): void => {
      statusListenerDisposer();
    };
  }, [clientFromRef]);
  return clientFromRef;
}

export const useClientErrorDetection = (
  clientType?: ClientType
): ClientError => {
  const clientRef: React.Ref<Client> = useRef(getClient(clientType));
  const clientFromRef: Client = clientRef.current as Client;
  const [error, setError] = useState<ClientError>(undefined);
  useEffect(() => {
    let isAuthorized = false;
    const statusListenerDisposer = clientFromRef.addListener(
      ClientEvent.STATUS_CHANGE,
      status => {
        if (status === ClientStatus.AUTHORIZED) {
          isAuthorized = true;
        }
        if (isAuthorized && status === ClientStatus.UNAUTHORIZED) {
          setError({ type: ClientError.UNEXPECTED_AUTH_CHANGE, message: '' });
          isAuthorized = false;
        }
      }
    );

    const errorListenerDisposer = clientFromRef.addListener(
      ClientEvent.ERROR,
      newError => {
        setError(newError as ClientError);
      }
    );
    const logoutListenerDisposer = clientFromRef.addListener(
      ClientEvent.LOGGING_OUT,
      (): void => {
        isAuthorized = false;
      }
    );

    return (): void => {
      errorListenerDisposer();
      statusListenerDisposer();
      logoutListenerDisposer();
    };
  }, [clientFromRef]);
  return error;
};

export function useClientCallback(clientType?: ClientType): Client {
  const clientRef: React.Ref<Client> = useRef(getClient(clientType));
  const clientFromRef: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusId>(clientFromRef.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!clientFromRef.isInitialized()) {
        await clientFromRef.handleCallback().catch(e =>
          clientFromRef.setError({
            type: ClientError.INIT_ERROR,
            message: e && e.toString()
          })
        );
      }
    };
    const statusListenerDisposer = clientFromRef.addListener(
      ClientEvent.STATUS_CHANGE,
      status => {
        setStatus(status as ClientStatusId);
      }
    );

    initClient();
    return (): void => {
      statusListenerDisposer();
    };
  }, [clientFromRef]);
  return clientFromRef;
}
