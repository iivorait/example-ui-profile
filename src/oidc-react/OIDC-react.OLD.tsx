import React, { useEffect } from 'react';
import Oidc, {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from 'oidc-client';

const location = window.location.origin;

export default function OIDCReactAuth() {
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
    const manager = new UserManager(settings);
    Oidc.Log.logger = console;
    Oidc.Log.level = 4;
    manager.events.addSilentRenewError(function(e) {
      console.log('silentRenewError', e);
    });
    /*
    window.addEventListener(
      'message',
      event => console.log('message', event.data),
      false
    );
    */
    setTimeout(() => {
      manager
        .signinSilent()
        .then(x => console.log('signinSilent', x))
        .catch(x => console.log('catched signinSilent failure', x));
    }, 2000);
  }, [settings]);
  return <div>OIDC...</div>;
}
