import React from 'react';
import { useLocation } from 'react-router-dom';
import { Switch, Route } from 'react-router';
import { ApolloProvider } from '@apollo/react-hooks';
import { Provider as ReduxProvider } from 'react-redux';
import { OidcProvider, loadUser, CallbackComponent } from 'redux-oidc';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import countries from 'i18n-iso-countries';
import fi from 'i18n-iso-countries/langs/fi.json';
import en from 'i18n-iso-countries/langs/en.json';
import sv from 'i18n-iso-countries/langs/sv.json';

import graphqlClient from './graphql/client';
import store from './redux/store';
// import userManager from './auth/userManager';
import enableOidcLogging from './auth/enableOidcLogging';
import Login from './auth/components/login/Login';
import OidcCallback from './auth/components/oidcCallback/OidcCallback';
import Profile from './profile/components/profile/Profile';
import { fetchApiTokenThunk } from './auth/redux';
import ProfileDeleted from './profile/components/profileDeleted/ProfileDeleted';
import AccessibilityStatement from './accessibilityStatement/AccessibilityStatement';
import { MAIN_CONTENT_ID } from './common/constants';
import AccessibilityShortcuts from './common/accessibilityShortcuts/AccessibilityShortcuts';
import AppMeta from './AppMeta';
//import useAuthenticate from './auth/useAuthenticate';
import authConstants from './auth/constants/authConstants';
import GdprAuthorizationCodeManagerCallback from './gdprApi/GdprAuthorizationCodeManagerCallback';
import ToastProvider from './toast/ToastProvider';
import IndexPage from './index/IndexPage';
import OIDCReactAuth from './oidc-react/OIDC-react';
import ReduxOIDCAuth from './redux-oidc/ReduxOIDC';

countries.registerLocale(fi);
countries.registerLocale(en);
countries.registerLocale(sv);

if (process.env.NODE_ENV !== 'production') {
  enableOidcLogging();
}
/*
loadUser(store, userManager).then(async user => {
  if (user && !user.expired) {
    store.dispatch(fetchApiTokenThunk(user.access_token));
  }
});

*/
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
  const location = useLocation();
  const [authenticate, logout] = [() => true, () => true]; //useAuthenticate();

  if (location.pathname === '/loginsso') {
    authenticate();
  }
  console.log('app!');
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

  const RComponent = () => <div>{Math.random()}</div>;
  /*
  <Route path="/callback">
                <OidcCallback />
              </Route>
              */
  return (
    <ReduxProvider store={store}>
      <ToastProvider>
        <MatomoProvider value={instance}>
          <AppMeta />
          <Switch>
            <Route path={['/keycloak']} exact>
              <RComponent />
              <IndexPage />
            </Route>
            <Route path={['/oidc']} exact>
              <RComponent />
              <OIDCReactAuth />
            </Route>
            <Route path={['/']} exact>
              <RComponent />
              <ReduxOIDCAuth />
            </Route>
            <Route path={['/callback']} exact>
              <div>CallBack</div>
              <OidcCallback />
            </Route>
            <Route path="*">404 - not found</Route>
          </Switch>
        </MatomoProvider>
      </ToastProvider>
    </ReduxProvider>
  );
}
export default App;
