import React from 'react';
import PageContent from '../components/PageContent';
import Profile from '../components/Profile';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import { ApiAccessTokenProvider } from '../components/ApiAccessTokenProvider';
import WithAuth from '../clients/WithAuth';

const Tokens = (): React.ReactElement => {
  return (
    <PageContent>
      <ApiAccessTokenProvider>
        {WithAuth(Profile, LoginInfo, AuthenticatingInfo)}
      </ApiAccessTokenProvider>
    </PageContent>
  );
};

export default Tokens;
