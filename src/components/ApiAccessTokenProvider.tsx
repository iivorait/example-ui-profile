import React, { FC } from 'react';

import { useApiAccessTokens, ApiAccessTokenActions } from '../clients/client';

export interface ApiAccessTokenContextProps {
  readonly actions: ApiAccessTokenActions;
}

export const ApiAccessTokenContext = React.createContext<ApiAccessTokenActions | null>(
  null
);

export const ApiAccessTokenProvider: FC<{}> = ({ children }) => {
  const actions = useApiAccessTokens();
  return (
    <ApiAccessTokenContext.Provider value={actions}>
      {children}
    </ApiAccessTokenContext.Provider>
  );
};
