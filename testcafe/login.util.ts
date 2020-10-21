/* eslint-disable import/no-extraneous-dependencies */
import { Selector } from 'testcafe';
import { ReactSelector } from 'testcafe-react-selectors';
/// <reference types="testcafe" />

export type LoginConfig = {
  username: string;
  password: string;
};
export async function loginFlowKeyCloak(
  t: TestController,
  config: LoginConfig
): Promise<void> {
  const LoginComponent = ReactSelector('LoginComponent');
  await LoginComponent.getReact();
  await t.click('[data-test-id="login-button"]');
  await Selector('#kc-form').exists;
  await t.typeText('#username', config.username);
  await t.typeText('#password', config.password);
  await t.click('#kc-login');
  await Selector('[data-test-id="logged-in-info"]').exists;
}
