import React, { useState } from 'react';
import { Notification } from 'hds-react';

import { useKeycloakErrorDetection, useKeycloak } from '../clients/keycloak';
import { ClientError } from '../clients';
import styles from './styles.module.css';

const ErrorPrompt = (props: React.PropsWithChildren<{}>) => {
  const [dismissedError, setDismissedError] = useState<ClientError>(undefined);
  const newError = useKeycloakErrorDetection();
  const client = useKeycloak();
  const lastErrorType = dismissedError && dismissedError.type;
  const newErrorType = newError && newError.type;
  if (lastErrorType === newErrorType) {
    return null;
  }
  const Prompt = () =>
    newError ? (
      <div className={styles['error-prompt-container']}>
        <div className={styles['error-prompt-content']}>
          <Notification
            label={'Error'}
            type={'error'}
            onClose={() => setDismissedError(newError)}
            dismissible
            closeButtonLabelText={'Sulje'}
          >
            Virhekoodi:{newErrorType}
          </Notification>
        </div>
        <div className={styles['error-prompt-overlay']}></div>
      </div>
    ) : null;

  return (
    <>
      {props.children}
      <Prompt />
    </>
  );
};

export default ErrorPrompt;
