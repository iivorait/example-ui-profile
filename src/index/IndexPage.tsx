import React, { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
// import { Button } from 'hds-react';

// import HelsinkiLogo from '../common/helsinkiLogo/HelsinkiLogo';
// import PageLayout from '../common/pageLayout/PageLayout';
// import styles from './IndexPage.module.css';
// import useAuthenticate from '../auth/useAuthenticate';
import { getClient } from '../clients/keycloak';

export default function IndexPage() {
  // const { t } = useTranslation();
  // const [authenticate] = useAuthenticate();
  const keyCloak = getClient({});
  const { login, logout, loadUserProfile, isAuthenticated } = keyCloak;
  const onClickLogin = () => {
    login();
  };
  const onClickLogout = () => {
    logout();
  };
  const onClickLoadUser = () => {
    loadUserProfile().then(profile =>
      console.log(JSON.stringify(profile, null, '  '))
    );
  };
  const [initialized, setInitialized] = useState(keyCloak.isInitialized());
  useEffect(() => {
    if (!initialized) {
      keyCloak.init().then(() => {
        setInitialized(keyCloak.isInitialized());
      });
    }
  }, [initialized, keyCloak]);

  const authenticated = initialized && isAuthenticated();
  return !initialized ? (
    <div>Initializing...</div>
  ) : (
    <>
      {!authenticated && (
        <button onClick={onClickLogin}>Login to keycloak</button>
      )}
      <br />
      {authenticated && (
        <button onClick={onClickLogout}>Logout from keycloak</button>
      )}
      <br />
      {authenticated && <button onClick={onClickLoadUser}>LoadUser</button>}
    </>
  );
  /*return (
    <PageLayout hideFooterLogo={true} title={'login.login'}>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <HelsinkiLogo className={styles.logo} />
          <h1>{t('login.title')}</h1>
          <h2>{t('login.description')}</h2>
          <Button
            variant="secondary"
            className={styles.button}
            onClick={() => {
              authenticate();
            }}
          >
            {t('login.login')}
          </Button>
        </div>
      </div>
    </PageLayout>
  );*/
}