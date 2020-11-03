import React, { useState } from 'react';
import { Button } from 'hds-react';
import PageContent from '../components/PageContent';
import AccessTokenForm from '../components/AccessTokenForm';
import AccessTokenOutput from '../components/AccessTokenOutput';
import { FetchApiTokenOptions } from '../clients';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../clients/WithAuth';
import { useApiAccessTokens } from '../clients/client';

const AuthenticatedContent = (): React.ReactElement => {
  const { getStatus, getTokens, fetch } = useApiAccessTokens();
  const status = getStatus();
  const isLoading = status === 'loading';
  const canLoad = status === 'loaded' || status === 'ready';
  const tokens = status === 'loaded' ? getTokens() : undefined;
  const [options, setOptions]: [FetchApiTokenOptions, Function] = useState({
    audience: process.env.REACT_APP_API_BACKEND_AUDIENCE || '',
    permission: process.env.REACT_APP_API_BACKEND_PERMISSION || '',
    grantType: process.env.REACT_APP_API_BACKEND_GRANT_TYPE || ''
  });
  const onSubmit = async (): Promise<void> => {
    if (isLoading) {
      return;
    }
    await fetch(options);
  };
  const onOptionChange = (newOptions: FetchApiTokenOptions): void => {
    setOptions(newOptions);
  };
  return (
    <PageContent>
      <h1>API Access tokenin haku</h1>
      <p>
        Jos käytössä on Tunnistamon endPoint, ei asetuksilla ole merkitystä.
      </p>
      <AccessTokenForm options={options} onOptionChange={onOptionChange} />
      <Button translate="" onClick={onSubmit} disabled={!canLoad}>
        Hae
      </Button>
      {isLoading && (
        <div>
          <span>Haetaan...</span>
        </div>
      )}
      <AccessTokenOutput accessToken={tokens} />
    </PageContent>
  );
};

const UnauthenticatedContent = (): React.ReactElement => {
  return (
    <PageContent>
      <LoginInfo />
    </PageContent>
  );
};

const AccessTokens = (): React.ReactElement => {
  return WithAuth(
    AuthenticatedContent,
    UnauthenticatedContent,
    AuthenticatingInfo
  );
};

export default AccessTokens;
