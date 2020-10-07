import React, { useContext, useState } from 'react';
import { Button } from 'hds-react';

import { ClientContext } from '../clients/ClientProvider';
import PageContent from '../components/PageContent';
import AccessTokenForm from '../components/AccessTokenForm';
import AccessTokenOutput from '../components/AccessTokenOutput';
import { Client, FetchApiTokenOptions } from '../clients';

const AccessTokens = (): React.ReactElement => {
  const clientContext = useContext(ClientContext);
  const client: Client | null = clientContext && clientContext.client;
  const [accessToken, setAccesstoken]: [
    Record<string, string>,
    Function
  ] = useState({});
  const [loading, setLoading] = useState(false);
  const [options, setOptions]: [FetchApiTokenOptions, Function] = useState({
    audience: process.env.REACT_APP_API_BACKEND_AUDIENCE || '',
    permission: process.env.REACT_APP_API_BACKEND_PERMISSION || '',
    grantType: process.env.REACT_APP_API_BACKEND_GRANT_TYPE || ''
  });
  const onSubmit = async (): Promise<void> => {
    if (loading || !client) {
      return;
    }
    setLoading(true);
    const result = await client.getAccessToken(options);
    setAccesstoken(result);
    setLoading(false);
  };
  const onOptionChange = (newOptions: FetchApiTokenOptions): void => {
    setOptions(newOptions);
  };
  if (!client || !client.isAuthenticated()) {
    return <div>Kirjaudu sisään.</div>;
  }
  return (
    <PageContent>
      <h1>Access tokenin haku</h1>
      <AccessTokenForm options={options} onOptionChange={onOptionChange} />
      <Button translate="" onClick={onSubmit} disabled={loading}>
        Hae
      </Button>
      {loading && (
        <div>
          <span>Haetaan...</span>
        </div>
      )}
      <AccessTokenOutput accessToken={accessToken} />
    </PageContent>
  );
};

export default AccessTokens;
