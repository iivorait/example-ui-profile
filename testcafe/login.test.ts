/* eslint-disable import/no-extraneous-dependencies */
import { Selector } from 'testcafe';
import { waitForReact } from 'testcafe-react-selectors';
import { loginFlowKeyCloak } from './login.util';

/// <reference types="testcafe" />

fixture(`Login to Keycloak`)
  .page('http://localhost:3000')
  .beforeEach(async () => {
    await waitForReact();
  });

test('Test1', async t => {
  await loginFlowKeyCloak(t, {
    username: 'test@email.com',
    password: 'Q4X2N5deT2AhwgykBIPhvcIVGR4QWLC7vQf'
  });
  await t
    .expect(Selector('[data-test-id="user-name"]').innerText)
    .eql('Test user');
});
