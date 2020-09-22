import React from 'react';

import styles from './styles.module.css';
import ErrorPrompt from './ErrorPrompt';

const PageContainer = (
  props: React.PropsWithChildren<{}>
): React.ReactElement => {
  return (
    <div className={styles.wrapper}>
      {props.children}
      <ErrorPrompt />
    </div>
  );
};

export default PageContainer;
