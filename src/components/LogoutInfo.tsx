import React from 'react';
import { Button } from 'hds-react';
import styles from './styles.module.css';
import { useClient } from '../clients/client';

const LogoutInfoComponent = (): React.ReactElement => {
  const { logout, getUser } = useClient();
  const user = getUser();
  const name = user ? `${user.given_name} ${user.family_name}` : '';
  return (
    <div className={styles['content-element']}>
      <h3>Olet kirjautunut, {name}</h3>
      <div>
        <Button translate="" onClick={logout}>
          Kirjaudu ulos
        </Button>
      </div>
    </div>
  );
};

export default LogoutInfoComponent;
