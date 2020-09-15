import React, { useContext } from 'react';
// import { useLocation } from 'react-router-dom';
import { Switch, Route } from 'react-router';
// import { ApolloProvider } from '@apollo/react-hooks';
import { Provider as ReduxProvider } from 'react-redux';
// import { OidcProvider, loadUser, CallbackComponent } from 'redux-oidc';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import countries from 'i18n-iso-countries';
import fi from 'i18n-iso-countries/langs/fi.json';
import en from 'i18n-iso-countries/langs/en.json';
import sv from 'i18n-iso-countries/langs/sv.json';

// import graphqlClient from './graphql/client';
import store from './redux/store';
import OidcCallback from './auth/components/oidcCallback/OidcCallback';
import AppMeta from './AppMeta';
//import useAuthenticate from './auth/useAuthenticate';
// import authConstants from './auth/constants/authConstants';
import ToastProvider from './toast/ToastProvider';
import IndexPage from './index/IndexPage';
import Index from './pages/Index';
import OIDCReactAuth from './oidc-react/Oidc-react';
import ReduxOIDCAuth from './redux-oidc/ReduxOIDC';
import { KeycloakProvider, KeycloakContext } from './clients/KeycloakProvider';
import Header from './components/Header';
import PageContainer from './components/PageContainer';

countries.registerLocale(fi);
countries.registerLocale(en);
countries.registerLocale(sv);

const instance = createInstance({
  urlBase: 'https://analytics.hel.ninja/',
  siteId: 60,
});

// Prevent non-production data from being submitted to Matomo
// by pretending to require consent to process analytics data and never ask for it.
// https://developer.matomo.org/guides/tracking-javascript-guide#step-1-require-consent
if (process.env.REACT_APP_ENVIRONMENT !== 'production') {
  window._paq.push(['requireConsent']);
}

type Props = {};

function App(props: Props) {
  // const location = useLocation();
  /*
  const [authenticate, logout] = useAuthenticate();
  
  if (location.pathname === '/loginsso') {
    authenticate();
  }
  
  window.addEventListener('storage', event => {
    if (
      event.key === authConstants.OIDC_KEY &&
      event.oldValue &&
      !event.newValue
    ) {
      logout();
    }
    if (
      event.key === authConstants.OIDC_KEY &&
      !event.oldValue &&
      event.newValue
    )
      authenticate();
  });
  */

  const RComponent = () => <div>{Math.random()}</div>;
  const KeyCloakConsumer = () => {
    const keycloak = useContext(KeycloakContext);
    return (
      <>
        <RComponent />
        <div>
          KeyCloakConsumer {keycloak && keycloak.userManager.getStatus()}
        </div>
      </>
    );
  };

  return (
    <KeycloakProvider>
      <ReduxProvider store={store}>
        <ToastProvider>
          <MatomoProvider value={instance}>
            <AppMeta />
            <PageContainer>
              <Header />
              <Switch>
                <Route path={['/']} exact>
                  <Index />
                </Route>
                <Route path={['/kc']} exact>
                  <RComponent />
                  <IndexPage />
                </Route>
                <Route path={['/kcc']} exact>
                  <KeycloakProvider>
                    <KeyCloakConsumer />
                  </KeycloakProvider>
                </Route>
                <Route path={['/oidc']} exact>
                  <RComponent />
                  <OIDCReactAuth />
                </Route>
                <Route path={['/redux']} exact>
                  <RComponent />
                  <ReduxOIDCAuth />
                </Route>
                <Route path={['/callback']} exact>
                  <div>CallBack</div>
                  <OIDCReactAuth verifyCallback />
                  {window.location.href === 'aaa' && <OidcCallback />}
                </Route>
                <Route path="*">404 - not found</Route>
              </Switch>
            </PageContainer>
          </MatomoProvider>
        </ToastProvider>
      </ReduxProvider>
    </KeycloakProvider>
  );
}
export default App;
