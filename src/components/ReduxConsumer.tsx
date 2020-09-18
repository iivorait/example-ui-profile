import React from 'react';
import { Button } from 'hds-react';
import { useSelector } from 'react-redux';

import styles from './styles.module.css';
import { StoreState } from '../clients/redux/store';

const ReduxConsumer = () => {
  const state: StoreState = useSelector((state: StoreState) => state);
  const { initialised, authenticated, user } = state;
  if (!initialised) {
    return (
      <div className={styles['content-element']}>
        Redux: Haetaan kirjautumistietoja...
      </div>
    );
  }
  if (authenticated) {
    const name = user ? `${user.given_name} ${user.family_name}` : '';
    return (
      <div className={styles['content-element']}>
        <h3>Redux: Olet kirjautunut, {name}</h3>
      </div>
    );
  }
  return (
    <div className={styles['content-element']}>
      <h3>Redux: Et ole kirjautunut</h3>
    </div>
  );
};

export default ReduxConsumer;
