import React from 'react';

import WithAuth, { WithAuthChildProps } from '../clients/WithAuth';

const AuthComponent = (props: WithAuthChildProps) => {
  const user = props.client.getUser();
  return <div>Authorized user is {user && user.given_name}</div>;
};
const UnAuthComponent = (props: WithAuthChildProps) => {
  const initialized = props.client.isInitialized();
  return initialized ? <div>User not logged in</div> : null;
};

const WithAuthDemo = () => {
  return WithAuth(AuthComponent, UnAuthComponent);
};

export default WithAuthDemo;
