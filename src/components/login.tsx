import React from 'react';
import { Button } from 'hds-react';

import styles from './styles.module.css';
import { Client } from '../clients';

type LoginProps = {
  client: Client;
};
const LoginComponent = ({ client }: LoginProps) => {
  const { isInitialized, isAuthenticated, logout, login, getUser } = client;
  if (!isInitialized()) {
    return (
      <div className={styles['content-element']}>
        Haetaan kirjautumistietoja...
      </div>
    );
  }
  if (isAuthenticated()) {
    const user = getUser();
    const name = user ? `${user.given_name} ${user.family_name}` : '';
    return (
      <div className={styles['content-element']}>
        <h3>Olet kirjautunut, {name}</h3>
        <div>
          <Button translate={''} onClick={logout}>
            Kirjaudu ulos
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className={styles['content-element']}>
      <h3>Et ole kirjautunut</h3>
      <div>
        <Button translate={''} onClick={login}>
          Kirjaudu sisään
        </Button>
      </div>
    </div>
  );
};

export default LoginComponent;
