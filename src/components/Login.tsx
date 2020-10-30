import React from 'react';
import DemoWrapper from './DemoWrapper';
import LoginInfo from './LoginInfo';
import LogoutInfo from './LogoutInfo';
import AuthenticatingInfo from './AuthenticatingInfo';
import WithAuth from '../clients/WithAuth';

const LoginComponent = (): React.ReactElement => {
  return (
    <DemoWrapper title="Keycloak-kuuntelija">
      {WithAuth(LogoutInfo, LoginInfo, AuthenticatingInfo)}
    </DemoWrapper>
  );
};

export default LoginComponent;
