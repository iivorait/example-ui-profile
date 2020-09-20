import React, { useEffect, useState } from 'react';

import { getClient } from '../clients/oidc-react_OLD';

export default function OIDCReactAuth(props?: { verifyCallback?: boolean }) {
  const verify = !!(props && props.verifyCallback);
  const [client] = useState(getClient({}));
  const { login, logout, loadUserProfile, isAuthenticated } = client;
  const [initialized, setInitialized] = useState(client.isInitialized());
  const onClickLogin = () => {
    login();
  };
  const onClickLogout = () => {
    logout();
  };
  const onClickLoadUser = () => {
    loadUserProfile().then(profile =>
      console.log(JSON.stringify(profile, null, '  '))
    );
  };
  useEffect(() => {
    if (verify) {
      client.handleCallback();
    } else if (!initialized) {
      client
        .init()
        .then(() => {
          setInitialized(client.isInitialized());
        })
        .catch((err: Error) => {
          console.log('client init error', err);
          setInitialized(client.isInitialized());
        });
    }
  }, [initialized, client, verify]);

  const authenticated = initialized && isAuthenticated();
  return !initialized ? (
    <div>Initializing...</div>
  ) : (
    <>
      {!authenticated && (
        <button onClick={onClickLogin}>Login with oidc</button>
      )}
      <br />
      {authenticated && (
        <button onClick={onClickLogout}>Logout with oidc</button>
      )}
      <br />
      {authenticated && <button onClick={onClickLoadUser}>LoadUser</button>}
    </>
  );
}
