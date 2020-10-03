import React from 'react';

import { ClientContext } from '../clients/ClientProvider';
import DemoWrapper from './DemoWrapper';

const ClientConsumer = (): React.ReactElement | null => {
  return (
    <ClientContext.Consumer>
      {(value): React.ReactElement | null => {
        const authenticated =
          value && value.client && value.client.isAuthenticated();
        const initialized =
          value && value.client && value.client.isInitialized();
        return initialized ? (
          <DemoWrapper title="Client context demo">
            <div>
              Client contextin mukaan käyttäjä{' '}
              {authenticated ? 'on kirjautunut.' : 'ei ole kirjautunut.'}
            </div>
          </DemoWrapper>
        ) : null;
      }}
    </ClientContext.Consumer>
  );
};

export default ClientConsumer;
