import React from 'react';
import PageContent from '../components/PageContent';
import TokenBrowser from '../components/TokenBrowser';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../clients/WithAuth';

const Tokens = (): React.ReactElement => {
  return (
    <PageContent>
      {WithAuth(TokenBrowser, LoginInfo, AuthenticatingInfo)}
    </PageContent>
  );
};

export default Tokens;
