import React from 'react';

import { Client } from '.';
import { useClient } from './client';

export type WithAuthChildProps = { client: Client };

const WithAuth = (
  AuthorizedContent: React.ComponentType<WithAuthChildProps>,
  UnAuthorizedContent: React.ComponentType<WithAuthChildProps>
): React.ReactElement => {
  const client = useClient();
  return client.isAuthenticated() ? (
    <AuthorizedContent client={client} />
  ) : (
    <UnAuthorizedContent client={client} />
  );
};

export default WithAuth;
