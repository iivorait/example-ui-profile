import React from 'react';

import { Client } from '.';
import { useKeycloak } from './keycloak';

export type WithAuthChildProps = { client: Client };

const WithAuth = (
  AuthorizedContent: React.ComponentType<any | string>,
  UnAuthorizedContent: React.ComponentType<any | string>
) => {
  const client = useKeycloak();
  return client.isAuthenticated() ? (
    <AuthorizedContent client={client} />
  ) : (
    <UnAuthorizedContent client={client} />
  );
};

export default WithAuth;
