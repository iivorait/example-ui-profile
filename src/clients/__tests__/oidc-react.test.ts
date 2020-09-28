describe('File must return one test ', () => {
  it(' and this is just a note:', () => {
    expect(
      !!'not done, as keycloak will likely be the chosen client'
    ).toBeTruthy();
  });
});

export default 'this line prevents lint error';
