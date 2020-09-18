import React from 'react';
import { Notification } from 'hds-react';

import { ToastTypes } from './types';

interface Props {
  title?: string;
  description?: string;
  id: string;
  type?: ToastTypes;
  onClose: () => void;
  hidden: boolean;
}

function Toast({ title, type, onClose, hidden, description }: Props) {
  return (
    <Notification label={title} type={type}>
      {description}
    </Notification>
  );
}

export default Toast;
