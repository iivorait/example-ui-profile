import React, { useState } from 'react';
import jwtDecode from 'jwt-decode';
import { getClientConfig, JWTPayload } from '../clients';
import { useClient } from '../clients/client';
import styles from './styles.module.css';

const TokenBrowser = (): React.ReactElement => {
  const client = useClient();
  const [selectedToken, changeSelectedToken] = useState<string | undefined>();
  const [selectedId, changeSelectedId] = useState<string | undefined>();
  const apiTokens = client.getApiTokens();
  const userTokens = client.getUserTokens();
  const config = getClientConfig();
  const isToken =
    selectedId &&
    selectedToken &&
    selectedToken.length > 20 &&
    selectedToken.indexOf('.') > -1;
  const decodedPayload: JWTPayload | undefined = isToken
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      jwtDecode(selectedToken!)
    : undefined;
  const decodedHeader: JWTPayload | undefined = decodedPayload
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      jwtDecode(selectedToken!, { header: true })
    : undefined;
  const onTokenSelectionChange = (
    newToken: string | undefined,
    id: string
  ): void => {
    changeSelectedToken(newToken);
    changeSelectedId(id);
  };

  const TokenSelection = (props: {
    title: string;
    id: string;
    token: string | undefined;
  }): React.ReactElement => {
    const { title, id, token } = props;
    return (
      <div>
        <label htmlFor={id}>
          <input
            type="radio"
            id={id}
            name="source"
            checked={selectedId === id}
            onChange={(): void => onTokenSelectionChange(token, id)}
          />{' '}
          {title}
        </label>
      </div>
    );
  };

  const UserTokens = (): React.ReactElement | null => {
    if (!userTokens) {
      return null;
    }
    return (
      <li>
        {Object.keys(userTokens).map(key => {
          return (
            <TokenSelection
              key={key}
              title={`Käyttäjän ${key}`}
              id={`user_${key}`}
              token={userTokens[key] || 'undefined'}
            />
          );
        })}
      </li>
    );
  };

  const ApiTokens = (): React.ReactElement | null => {
    if (!apiTokens) {
      return null;
    }
    return (
      <div>
        {Object.keys(apiTokens).map(key => {
          return (
            <TokenSelection
              key={key}
              title={`Api token ${key}`}
              id={`user_${key}`}
              token={apiTokens[key] || 'undefined'}
            />
          );
        })}
      </div>
    );
  };

  const secondsToUTCString = (seconds: number | string): string => {
    return new Date(Number(seconds) * 1000).toUTCString();
  };

  return (
    <div>
      <h2>Käyttäjän tokenit:</h2>
      <ul className={styles['user-token-list']}>
        <UserTokens />
        <ApiTokens />
      </ul>
      {decodedPayload && (
        <>
          <h3>Header:</h3>
          <pre>
            {decodedHeader ? JSON.stringify(decodedHeader, null, 2) : ''}
          </pre>
          <h3>Payload:</h3>
          <pre>
            {decodedPayload ? JSON.stringify(decodedPayload, null, 2) : ''}
          </pre>
          {decodedPayload && (
            <>
              <h3>Expiration & iat:</h3>
              <p>
                <strong>Exp:</strong> {secondsToUTCString(decodedPayload.exp)}
              </p>
              <p>
                <strong>Iat:</strong> {secondsToUTCString(decodedPayload.iat)}
              </p>
              <h3>Config:</h3>
              <p>
                <strong>Scope:</strong> {config.scope}
              </p>
              <p>
                <strong>ClientId:</strong> {config.clientId}
              </p>
            </>
          )}
        </>
      )}
      {selectedId && (
        <>
          <h3>Token:</h3>
          <span className={styles.token}>{selectedToken}</span>
        </>
      )}
    </div>
  );
};

export default TokenBrowser;
