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
.env files are not used at the moment! Change server endpoint in "src/clients/keycloak.ts

## Docker

Run `docker-compose up`
