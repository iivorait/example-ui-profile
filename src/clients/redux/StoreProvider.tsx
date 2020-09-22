import React, { useEffect, FC } from 'react';
import { Provider } from 'react-redux';

import { store, connectClient } from './store';
import { connected } from './actions';
import { useKeycloak } from '../keycloak';

const StoreProvider: FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const client = useKeycloak();
  useEffect(() => {
    connectClient(client);
    store.dispatch(connected(client));
  }, [client]);
  return <Provider store={store}>{children}</Provider>;
};

export default StoreProvider;
