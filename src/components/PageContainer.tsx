import React from 'react';

import styles from './styles.module.css';

const PageContainer = (props: React.PropsWithChildren<{}>) => {
  return <div className={styles.wrapper}>{props.children}</div>;
};

export default PageContainer;
