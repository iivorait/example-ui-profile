import React, { useContext } from 'react';

import { KeycloakContext } from '../clients/KeycloakProvider';
import LoginComponent from '../components/login';
import PageContent from '../components/PageContent';
import ReduxConsumer from '../components/ReduxConsumer';
import WithAuthDemo from '../components/WithAuthDemo';

const IndexPage = () => {
  const keycloak = useContext(KeycloakContext);
  return (
    <PageContent>
      {!!keycloak && keycloak.userManager ? (
        <>
          <LoginComponent client={keycloak.userManager} />
          <ReduxConsumer />
          <WithAuthDemo />
        </>
      ) : (
        <div>Keycloak client not found</div>
      )}
    </PageContent>
  );
};

export default IndexPage;
