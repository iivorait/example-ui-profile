# example-profile-ui
Example UI application that interacts with Keycloak (and later also with Helsinki profile)

There are two clients that can be used for authentication: keycloak.js and oidc-react.js. The version of the oidc-react.js npm library is beta and keycloak is the official package released with keycloak server. Currently keycload client is used in this demo.

Included in this demo app:
- two login clients
- hooks for easy usage
- redux store listening a client
- HOC component listening a client and showing different content for authorized and unauthorized users.

Clients dispatch events and trigger changes which then trigger re-rendering of the components using clients.

## using oidc-client
Used client type is defined in .env.
Settings for keycloak
```yml
REACT_APP_OIDC_CLIENT_TYPE="keycloak"
REACT_APP_OIDC_SILENT_AUTH_PATH="/silent-check-sso.html"
REACT_APP_OIDC_CALLBACK_PATH="/"
```
Settings for oidc-react
```yml
REACT_APP_OIDC_CLIENT_TYPE="oidc"
REACT_APP_OIDC_SILENT_AUTH_PATH="/silent_renew.html"
REACT_APP_OIDC_CALLBACK_PATH="/callback"
```

## Oidc and keyclock client differences
Client libraries trigger different events when client status changes or an error occurs.

CLIENT_READY:
  - oidc does not trigger this event. Keycloak triggers this when onReady() is called. This is same as either AUTHORIZE or UNAUTHORIZED event.
TOKEN_EXPIRING:
  - triggered only by oidc
ERROR event with type AUTH_ERROR:
  - Oidc trigger the event if silent signin results in error, but not if error is 'login_required'. Keycloak triggers this error when onAuthError() is called


## Config
use .env -files. Some values are client specific. Default client is keycloak and relevant settings are:
```yml
REACT_APP_OIDC_URL="https://tunnistus.hel.ninja/auth"
REACT_APP_OIDC_REALM="helsinki-tunnistus"
REACT_APP_OIDC_CLIENT_ID="https://api.hel.fi/auth/example-ui-profile"
```
other settings should not be changed

Config can also be overridden for command line:
```bash
REACT_APP_OIDC_URL=https://foo.bar yarn start
```
## Docker

Run `docker-compose up`

Starting docker with temporary environment variables:
Open docker-compose.yml and add new 'environment' under services/app.

Example:

```yml
services:
  app:
    environment: 
      - REACT_APP_OIDC_URL=https://foo.bar 
```
