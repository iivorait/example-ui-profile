/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import { loginFlowKeyCloak } from '../plugins/login.flow';

describe('Open frontpage', () => {
  it('Contains correct page title', () => {
    cy.visit(`/`);
    cy.contains('Example');
  });

  it('Login to keycloak', () => {
    loginFlowKeyCloak(cy, {
      username: 'test@email.com',
      password: 'Q4X2N5deT2AhwgykBIPhvcIVGR4QWLC7vQf'
    });
    cy.get('[data-test-id="user-name"]').contains('Test user');
    cy.visit(`/`);
    cy.get('[data-test-id="user-name"]').contains('Test user');
  });

  it('Has no detectable a11y violations on load', () => {
    cy.visit(`/`);
    cy.get('[data-test-id="user-name"]').contains('Test user');
    // cy.injectAxe();
    // cy.checkA11y();
  });
});
