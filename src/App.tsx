import React from 'react';
import { Switch, Route } from 'react-router';
import countries from 'i18n-iso-countries';
import fi from 'i18n-iso-countries/langs/fi.json';
import en from 'i18n-iso-countries/langs/en.json';
import sv from 'i18n-iso-countries/langs/sv.json';

import AppMeta from './AppMeta';
import Index from './pages/Index';
import { KeycloakProvider } from './clients/KeycloakProvider';
import OidcCallback from './clients/OidcCallback';
import StoreProvider from './clients/redux/StoreProvider';
import Header from './components/Header';
import PageContainer from './components/PageContainer';

countries.registerLocale(fi);
countries.registerLocale(en);
countries.registerLocale(sv);

type Props = {};

function App(props: Props) {
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
