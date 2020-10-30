import React from 'react';
import styles from './styles.module.css';

const AccessTokenOutput = (props: {
  accessToken?: Record<string, string>;
}): React.ReactElement | null => {
  const { accessToken } = props;
  if (!accessToken) {
    return null;
  }
  return (
    <div className={styles['access-token-output']}>
      <h2>Haettu token:</h2>
      <span className={styles.token}>
        {JSON.stringify(accessToken, null, 2)}
      </span>
    </div>
  );
};

export default AccessTokenOutput;
