import React from 'react';

import { KeycloakContext } from '../clients/KeycloakProvider';
import DemoWrapper from './DemoWrapper';

const KeycloakConsumer = (): React.ReactElement | null => {
  return (
    <KeycloakContext.Consumer>
      {(value): React.ReactElement | null => {
        const authenticated =
          value && value.client && value.client.isAuthenticated();
        const initialized =
          value && value.client && value.client.isInitialized();
        return initialized ? (
          <DemoWrapper title="Keycloak context demo">
            <div>
              Keycloak contextin mukaan käyttäjä{' '}
              {authenticated ? 'on kirjautunut.' : 'ei ole kirjautunut.'}
            </div>
          </DemoWrapper>
        ) : null;
      }}
    </KeycloakContext.Consumer>
  );
};

export default KeycloakConsumer;
