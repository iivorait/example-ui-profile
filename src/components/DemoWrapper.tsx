import React from 'react';

import styles from './styles.module.css';

const DemoWrapper = (
  props: React.PropsWithChildren<{ title: string }>
): React.ReactElement => {
  const { title, children } = props;
  return (
    <div className={styles['demo-box']}>
      <h4>{title}</h4>
      <div>{children}</div>
    </div>
  );
};

export default DemoWrapper;
