import React, { useContext } from 'react';
// import { useLocation } from 'react-router-dom';
import { Switch, Route } from 'react-router';
// import { ApolloProvider } from '@apollo/react-hooks';
// import { Provider as ReduxProvider } from 'react-redux';
// import { OidcProvider, loadUser, CallbackComponent } from 'redux-oidc';
import countries from 'i18n-iso-countries';
import fi from 'i18n-iso-countries/langs/fi.json';
import en from 'i18n-iso-countries/langs/en.json';
import sv from 'i18n-iso-countries/langs/sv.json';

// import graphqlClient from './graphql/client';
// import OidcCallback from './auth/components/oidcCallback/OidcCallback';
import AppMeta from './AppMeta';
//import useAuthenticate from './auth/useAuthenticate';
// import authConstants from './auth/constants/authConstants';
import IndexPage from './index/IndexPage';
import Index from './pages/Index';
import { KeycloakProvider, KeycloakContext } from './clients/KeycloakProvider';
import OidcCallback from './clients/OidcCallback';
import StoreProvider from './clients/redux/StoreProvider';
import Header from './components/Header';
import PageContainer from './components/PageContainer';

countries.registerLocale(fi);
countries.registerLocale(en);
countries.registerLocale(sv);

type Props = {};

function App(props: Props) {
  const ReRenderIndicator = () => <div>{Math.random()}</div>;
  const KeyCloakConsumer = () => {
    const keycloak = useContext(KeycloakContext);
    return (
      <>
        <ReRenderIndicator />
        <div>
          KeyCloakConsumer {keycloak && keycloak.userManager.getStatus()}
        </div>
      </>
    );
  };

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
            <Route path={['/kc']} exact>
              <ReRenderIndicator />
              <IndexPage />
            </Route>
            <Route path={['/kcc']} exact>
              <KeycloakProvider>
                <KeyCloakConsumer />
              </KeycloakProvider>
            </Route>
            <Route path={['/oidc']} exact>
              <ReRenderIndicator />
              <div>Oidc should be used via hooks</div>
            </Route>
            <Route path={['/redux']} exact>
              <ReRenderIndicator />
              <div>Redux included already</div>
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
