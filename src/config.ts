import { ClientProps } from './clients/index';

function envValueToBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  const strValue = String(value).toLowerCase();
  if (value === '' || strValue === 'false' || strValue === '0') {
    return false;
  }
  if (strValue === 'true' || strValue === '1') {
    return true;
  }
  return defaultValue;
}

const clientConfig: ClientProps = {
  realm: String(process.env.REACT_APP_OIDC_REALM),
  url: String(process.env.REACT_APP_OIDC_URL),
  authority: `${process.env.REACT_APP_OIDC_URL}/realms/${process.env.REACT_APP_OIDC_REALM}`,
  clientId: String(process.env.REACT_APP_OIDC_CLIENT_ID),
  callbackPath: process.env.REACT_APP_OIDC_CALLBACK_PATH || undefined,
  logoutPath: process.env.REACT_APP_OIDC_LOGOUT_PATH || '/',
  silentAuthPath: process.env.REACT_APP_OIDC_SILENT_AUTH_PATH,
  responseType: process.env.REACT_APP_OIDC_RESPONSE_TYPE || 'id_token token',
  scope: process.env.REACT_APP_OIDC_SCOPE || 'profile',
  autoSignIn: envValueToBoolean(process.env.REACT_APP_OIDC_AUTO_SIGN_IN, true),
  automaticSilentRenew: envValueToBoolean(
    process.env.REACT_APP_OIDC_AUTO_SILENT_RENEW,
    true
  ),
  enableLogging: envValueToBoolean(process.env.REACT_APP_OIDC_LOGGING, false),
  loginType:
    (process.env.REACT_APP_OIDC_LOGIN_TYPE as ClientProps['loginType']) ||
    'check-sso',
  flow: (process.env.REACT_APP_OIDC_FLOW as ClientProps['flow']) || 'hybrid'
};

function getLocationBasedUri(property: string | undefined): string | undefined {
  const location = window.location.origin;
  if (property === undefined) {
    return undefined;
  }
  return `${location}${property}`;
}

export default {
  client: clientConfig,
  getLocationBasedUri
};
