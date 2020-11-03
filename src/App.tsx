import React from 'react';
import { Switch, Route, useRouteMatch } from 'react-router';

import Index from './pages/Index';
import ApiAccessTokens from './pages/ApiAccessTokens';
import Tokens from './pages/Tokens';
import ProfilePage from './pages/ProfilePage';
import { ClientProvider } from './clients/ClientProvider';
import OidcCallback from './clients/OidcCallback';
import StoreProvider from './clients/redux/StoreProvider';
import Header from './components/Header';
import PageContainer from './components/PageContainer';
import config from './config';
import { setClientConfig } from './clients/index';

setClientConfig(config.client);

function App(): React.ReactElement {
  const { callbackPath } = config.client;
  const isCallbackUrl = useRouteMatch(callbackPath);
  if (callbackPath && isCallbackUrl) {
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
            <Route path={['/apiAccessTokens']} exact>
              <ApiAccessTokens />
            </Route>
            <Route path={['/userTokens']} exact>
              <Tokens />
            </Route>
            <Route path={['/profile']} exact>
              <ProfilePage />
            </Route>
            <Route path={['/authError']} exact>
              <div>Autentikaatio epäonnistui</div>
            </Route>
            <Route path="*">404 - not found</Route>
          </Switch>
        </PageContainer>
      </StoreProvider>
    </ClientProvider>
  );
}
export default App;
