import React, { useState, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { OidcProvider, loadUser } from 'redux-oidc';
import Oidc, {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from 'oidc-client';

import store from '../redux/store';
import { fetchApiTokenThunk } from '../auth/redux';

const location = window.location.origin;

export default function ReduxOIDCAuth() {
  /* eslint-disable @typescript-eslint/camelcase */
  const settings: UserManagerSettings = {
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    authority: 'https://tunnistus.hel.ninja/auth/realms/helsinki-tunnistus', //process.env.REACT_APP_OIDC_AUTHORITY,
    automaticSilentRenew: true,
    client_id: 'https://api.hel.fi/auth/example-ui-profile', // process.env.REACT_APP_OIDC_CLIENT_ID, process.env.REACT_APP_OIDC_CLIENT_ID, //
    redirect_uri: `${location}/callback`,
    response_type: 'id_token token',
    silent_redirect_uri: `${location}/silent_renew.html`,
    post_logout_redirect_uri: `${location}/`,
    // This calculates to 1 minute, good for debugging:
    // https://github.com/City-of-Helsinki/kukkuu-ui/blob/8029ed64c3d0496fa87fa57837c73520e8cbe37f/src/domain/auth/userManager.ts#L18
    // accessTokenExpiringNotificationTime: 59.65 * 60,
  };
  /* eslint-enable @typescript-eslint/camelcase */
  useEffect(() => {
    const userManager = new UserManager(settings);
    console.log('GO');
    loadUser(store, userManager).then(async user => {
      console.log('user', user);
      if (user && !user.expired) {
        // store.dispatch(fetchApiTokenThunk(user.access_token));
        console.log('all is good');
      } else {
        userManager.signinRedirect().catch(error => {
          console.log('signingerror');
        });
      }
    });
  }, [settings]);
  return (
    <ReduxProvider store={store}>
      <div>Redux OIDC...</div>
    </ReduxProvider>
  );
}
