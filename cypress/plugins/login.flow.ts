export type LoginConfig = {
  username: string;
  password: string;
};
export function loginFlowKeyCloak(
  cy: Cypress.cy & EventEmitter,
  config: LoginConfig
): void {
  cy.get('[data-test-id="login-button"]').click();
  cy.get('#kc-form');
  cy.get('#username').type(config.username);
  cy.get('#password').type(config.password);
  cy.get('#kc-login').click();
  cy.get('[data-test-id="logged-in-info"]');
}
