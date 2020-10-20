/// <reference types="testcafe" />

fixture(`Login to Keycloak`).page('http://localhost:3000');

test('Test1', async t => {
  t.click('#d');
});
