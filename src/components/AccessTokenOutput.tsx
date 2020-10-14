import React from 'react';
import styles from './styles.module.css';

const AccessTokenOutput = (props: {
  accessToken?: Record<string, string>;
}): React.ReactElement | null => {
  const { accessToken } = props;
  if (!accessToken || (!accessToken.access_token && !accessToken.error)) {
    return null;
  }
  return (
    <div className={styles['access-token-output']}>
      <h2>Haettu token:</h2>
      <pre>{JSON.stringify(accessToken, null, 2)}</pre>
    </div>
  );
};

export default AccessTokenOutput;
