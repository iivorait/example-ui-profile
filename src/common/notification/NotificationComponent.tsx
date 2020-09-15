import React, { PropsWithChildren } from 'react';
import { Notification, NotificationType } from 'hds-react';
import { useTranslation } from 'react-i18next';

import styles from './NotificationComponent.module.css';

type Props = PropsWithChildren<{
  show: boolean;
  labelText?: string;
  type?: NotificationType;
  onClose?: () => void;
}>;

function NotificationComponent(props: Props) {
  const { t } = useTranslation();
  if (!props.show) return null;
  return (
    <div className={styles.notification}>
      <Notification
        type={props.type || 'error'}
        label={props.labelText || t('notification.defaultErrorTitle')}
        closeButtonLabelText={t('notification.closeButtonText')}
        onClose={props.onClose}
      >
        <div className={styles.messageWrapper}>
          {props.children || t('notification.defaultErrorText')}
        </div>
      </Notification>
    </div>
  );
}

export default NotificationComponent;
