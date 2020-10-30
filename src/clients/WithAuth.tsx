import React from 'react';

import { Client } from '.';
import { useClient } from './client';

export type WithAuthChildProps = { client: Client };

const WithAuth = (
  AuthorizedContent: React.ComponentType<WithAuthChildProps>,
  UnAuthorizedContent: React.ComponentType<WithAuthChildProps>,
  InitializingContent?: React.ComponentType<{}>
): React.ReactElement => {
  const client = useClient();
  if (InitializingContent && !client.isInitialized()) {
    return <InitializingContent />;
  }
  return client.isAuthenticated() ? (
    <AuthorizedContent client={client} />
  ) : (
    <UnAuthorizedContent client={client} />
  );
};

export default WithAuth;
