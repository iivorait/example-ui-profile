import React from 'react';
import styles from './styles.module.css';

const AuthenticatingInfoComponent = (): React.ReactElement => {
  return (
    <div className={styles['content-element']}>
      Haetaan kirjautumistietoja...
    </div>
  );
};

export default AuthenticatingInfoComponent;
