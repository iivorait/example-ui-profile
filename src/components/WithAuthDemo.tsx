import React from 'react';

import WithAuth, { WithAuthChildProps } from '../clients/WithAuth';
import DemoWrapper from './DemoWrapper';

const AuthComponent = (props: WithAuthChildProps) => {
  const user = props.client.getUser();
  return (
    <DemoWrapper title="Sisältö vain kirjatuneelle">
      <div>
        Tämä sisältö on kirjautuneelle.Kirjautunut käyttäjä on{' '}
        {user && user.given_name}
      </div>
    </DemoWrapper>
  );
};
const UnAuthComponent = (props: WithAuthChildProps) => {
  const initialized = props.client.isInitialized();
  return initialized ? (
    <DemoWrapper title="Sisältö kirjautumattomalle">
      <div>Et ole kirjautunut sisään...</div>
    </DemoWrapper>
  ) : null;
};

const WithAuthDemo = () => {
  return WithAuth(AuthComponent, UnAuthComponent);
};

export default WithAuthDemo;
