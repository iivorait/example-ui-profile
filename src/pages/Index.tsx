import React, { useContext } from 'react';
import { ClientContext } from '../clients/ClientProvider';
import LoginComponent from '../components/Login';
import PageContent from '../components/PageContent';
import ReduxConsumer from '../components/ReduxConsumer';
import WithAuthDemo from '../components/WithAuthDemo';
import KeycloakConsumer from '../components/ClientConsumer';
import { getClientConfig } from '../clients';

const IndexPage = (): React.ReactElement => {
  const clientContext = useContext(ClientContext);
  const clientConfig = getClientConfig();
  return (
    <PageContent>
      {!!clientContext && clientContext.client ? (
        <>
          <h1>Client-demo</h1>
          <p>
            Tässä demossa näytetään kirjautumisikkuna ja komponentteja, jotka
            kuuntelevat muutoksia kirjautumisessa.
          </p>
          <p>
            Voit kirjautua sisään / ulos alla olevasta komponentista tai
            headerista.
          </p>
          <p>Voit myös kirjatua ulos toisessa ikkunassa.</p>
          <p>
            Clientiksi on .env-filessä määritelty:
            <strong>{clientConfig.type}</strong>
          </p>
          <LoginComponent />
          <ReduxConsumer />
          <WithAuthDemo />
          <KeycloakConsumer />
        </>
      ) : (
        <div>Error:Keycloakia ei löydy</div>
      )}
    </PageContent>
  );
};

export default IndexPage;
