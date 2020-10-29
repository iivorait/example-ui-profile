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
    Record<string, string> | undefined,
    Function
  ] = useState(undefined);
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
  if (!client || !client.isInitialized()) {
    return (
      <PageContent>
        <div>Haetaan kirjautumistietoja...</div>
      </PageContent>
    );
  }
  if (!client.isAuthenticated()) {
    return (
      <PageContent>
        <Button translate="" onClick={client.login}>
          Kirjaudu sisään
        </Button>
      </PageContent>
    );
  }
  return (
    <PageContent>
      <h1>Access tokenin haku</h1>
      <p>
        Jos käytössä on Tunnistamon endPoint, ei asetuksilla ole merkitystä.
      </p>
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
