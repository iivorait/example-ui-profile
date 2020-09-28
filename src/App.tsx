import React from 'react';
import { Switch, Route } from 'react-router';

import AppMeta from './AppMeta';
import Index from './pages/Index';
import { KeycloakProvider } from './clients/KeycloakProvider';
import OidcCallback from './clients/OidcCallback';
import StoreProvider from './clients/redux/StoreProvider';
import Header from './components/Header';
import PageContainer from './components/PageContainer';

type Props = {};

function App(): React.ReactElement {
  return (
    <KeycloakProvider>
      <StoreProvider>
        <AppMeta />
        <PageContainer>
          <Header />
          <Switch>
            <Route path={['/']} exact>
              <Index />
            </Route>
            <Route path={['/callback']} exact>
              <div>CallBack</div>
              <OidcCallback successRedirect="/" failureRedirect="/" />
            </Route>
            <Route path="*">404 - not found</Route>
          </Switch>
        </PageContainer>
      </StoreProvider>
    </KeycloakProvider>
  );
}
export default App;
