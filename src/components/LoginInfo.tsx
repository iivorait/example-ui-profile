import React from 'react';
import { Button } from 'hds-react';
import styles from './styles.module.css';
import { useClient } from '../clients/client';

const LoginInfoComponent = (): React.ReactElement => {
  const { login } = useClient();
  return (
    <div className={styles['content-element']}>
      <h3>Et ole kirjautunut</h3>
      <div>
        <Button translate="" onClick={login}>
          Kirjaudu sisään
        </Button>
      </div>
    </div>
  );
};

export default LoginInfoComponent;
