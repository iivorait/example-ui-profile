import React from 'react';

// import Notification from '../common/notification/NotificationComponent';
import { ToastTypes } from './types';

interface Props {
  title?: string;
  description?: string;
  id: string;
  type?: ToastTypes;
  onClose: () => void;
  hidden: boolean;
}

const Notification = (props: React.PropsWithChildren<{}>) => {
  return <div>{props.children}</div>;
};

function Toast({ title, type, onClose, hidden, description }: Props) {
  return <Notification>{description}</Notification>;
}

export default Toast;
