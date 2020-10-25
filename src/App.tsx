import React from 'react';
import { Switch, Route, useRouteMatch } from 'react-router';

import Index from './pages/Index';
import AccessTokens from './pages/AccessTokens';
import { ClientProvider } from './clients/ClientProvider';
import OidcCallback from './clients/OidcCallback';
import StoreProvider from './clients/redux/StoreProvider';
import Header from './components/Header';
import PageContainer from './components/PageContainer';
import config from './config';
import { setClientConfig } from './clients/index';

setClientConfig(config.client);

function App(): React.ReactElement {
  const isCallbackUrl = useRouteMatch('/callback');
  if (isCallbackUrl) {
    return (
      <PageContainer>
        <OidcCallback successRedirect="/" failureRedirect="/authError" />
      </PageContainer>
    );
  }
  return (
    <ClientProvider>
      <StoreProvider>
        <PageContainer>
          <Header />
          <Switch>
            <Route path={['/']} exact>
              <Index />
            </Route>
            <Route path={['/accessTokens']} exact>
              <AccessTokens />
            </Route>
            <Route path={['/authError']} exact>
              <div>Authentikaatio epäonnistui</div>
            </Route>
            <Route path="*">404 - not found</Route>
          </Switch>
        </PageContainer>
      </StoreProvider>
    </ClientProvider>
  );
}
export default App;
