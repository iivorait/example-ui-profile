import React, { useContext } from 'react';

import { KeycloakContext } from '../clients/KeycloakProvider';
import LoginComponent from '../components/Login';
import PageContent from '../components/PageContent';
import ReduxConsumer from '../components/ReduxConsumer';
import WithAuthDemo from '../components/WithAuthDemo';

const IndexPage = (): React.ReactElement => {
  const keycloak = useContext(KeycloakContext);
  return (
    <PageContent>
      {!!keycloak && keycloak.userManager ? (
        <>
          <h1>Keycloak-demo</h1>
          <p>
            Tässä demossa näytetään kirjautumisikkuna ja komponentteja, jotka
            kuuntelevat muutoksia kirjautumisessa.
          </p>
          <p>
            Voit kirjautua sisään / ulos alla olevasta komponentista tai
            headerista.
          </p>
          <p>Voit myös kirjatua ulos toisessa ikkunassa.</p>
          <LoginComponent client={keycloak.userManager} />
          <ReduxConsumer />
          <WithAuthDemo />
        </>
      ) : (
        <div>Error:Keycloakia ei löydy</div>
      )}
    </PageContent>
  );
};

export default IndexPage;
