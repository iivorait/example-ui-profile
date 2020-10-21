/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { axeCheck, createReport } from 'axe-testcafe';
/// <reference types="testcafe" />

fixture(`Login to Keycloak`).page('http://localhost:3000');

test('Automated accessibility testing', async t => {
  const { violations } = await axeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
});
