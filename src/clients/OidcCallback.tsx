import React from 'react';
import { Redirect } from 'react-router';

import { useClientCallback } from './client';

export type OidcCallbackProps = {
  successRedirect: string;
  failureRedirect: string;
};

const OidcCallback = (props: OidcCallbackProps): React.ReactElement => {
  const client = useClientCallback();
  const initialized = client.isInitialized();
  const authenticated = client.isAuthenticated();
  if (!initialized) {
    return <div>Tarkistetaan kirjautumistietoja...</div>;
  }
  return authenticated ? (
    <Redirect to={props.successRedirect} />
  ) : (
    <Redirect to={props.failureRedirect} />
  );
};

export default OidcCallback;
