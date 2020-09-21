import React from 'react';
import { useSelector } from 'react-redux';

import styles from './styles.module.css';
import { StoreState } from '../clients/redux/store';
import DemoWrapper from './DemoWrapper';

const ReduxConsumer = () => {
  const state: StoreState = useSelector((state: StoreState) => state);
  const { initialised, authenticated, user } = state;
  if (!initialised) {
    return (
      <DemoWrapper title="Redux-kuuntelija">
        <div className={styles['content-element']}>
          Haetaan kirjautumistietoja...
        </div>
      </DemoWrapper>
    );
  }
  if (authenticated) {
    const name = user ? `${user.given_name} ${user.family_name}` : '';
    return (
      <DemoWrapper title="Redux-kuuntelija">
        <div className={styles['content-element']}>
          <h3>Olet kirjautunut, {name}</h3>
        </div>
      </DemoWrapper>
    );
  }
  return (
    <DemoWrapper title="Redux-kuuntelija">
      <div className={styles['content-element']}>
        <h3>Et ole kirjautunut</h3>
      </div>
    </DemoWrapper>
  );
};

export default ReduxConsumer;
