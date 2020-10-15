/// <reference types="cypress" />
/// <reference types="cypress-axe" />

describe('Open frontpage', () => {
  beforeEach(() => {
    cy.visit(`/`);
  });

  it('Contains correct page title', () => {
    cy.contains('Example');
  });

  it('Has no detectable a11y violations on load', () => {
    cy.injectAxe();
    cy.checkA11y();
  });
});
