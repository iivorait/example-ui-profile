# example-profile-ui
Example UI application that interacts with Keycloak (and later also with Helsinki profile)

There are two clients that can be used for authentication: keycloak.js and oidc-react.js. The version of the oidc-react.js npm library is beta and keycloak is the official package released with keycloak server. Currently keycload client is used in this demo.

Included in this demo app:
- two login clients
- hooks for easy usage
- redux store listening a client
- HOC component listening a client and showing different content for authorized and unauthorized users.

Clients dispatch events and trigger changes which then trigger re-rendering of the components using clients.


## Config
use .env -files. Some values are client specific. Default client is keycloak and relevant settings are:
REACT_APP_OIDC_URL="https://tunnistus.hel.ninja/auth"
REACT_APP_OIDC_REALM="helsinki-tunnistus"
REACT_APP_OIDC_CLIENT_ID="https://api.hel.fi/auth/example-ui-profile"

other settings should not be changed

Config can also be overridden for command line:
REACT_APP_OIDC_URL=https://foo.bar yarn start

## Docker

Run `docker-compose up`

Starting docker with temporary environment variables:
Open docker-compose.yml and add new new 'environment' under services/app.

Example:

services:
  app:
    environment: 
      - REACT_APP_OIDC_URL=https://foo.bar 