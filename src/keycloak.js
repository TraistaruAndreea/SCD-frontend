import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8180',
  realm: 'ktor_realm',
  clientId: 'vue-ui'
});

export default keycloak;
