import React from 'react';

import styles from './styles.module.css';

const PageContent = (props: React.PropsWithChildren<{}>) => {
  return <div className={styles.content}>{props.children}</div>;
};

export default PageContent;
