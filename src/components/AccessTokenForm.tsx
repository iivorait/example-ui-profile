import React from 'react';

import { FetchApiTokenOptions } from '../clients';
import styles from './styles.module.css';

const AccessTokenForm = (props: {
  options: FetchApiTokenOptions;
  onOptionChange: Function;
}): React.ReactElement => {
  const { options } = props;
  const onChange = (
    target: 'audience' | 'permission' | 'grantType',
    value: string
  ): void => {
    options[target] = value;
    props.onOptionChange({ ...options });
  };
  return (
    <form className={styles['access-token-form']}>
      <h2>Asetukset:</h2>
      <div>
        <label htmlFor="accessTokenAudience">
          Audience:
          <input
            type="text"
            id="accessTokenAudience"
            value={options.audience}
            onChange={(e): void => onChange('audience', e.target.value)}
          />
        </label>
      </div>
      <div>
        <label htmlFor="accessTokenPermission">
          Permission:
          <input
            type="text"
            id="accessTokenPermission"
            value={options.permission}
            onChange={(e): void => onChange('permission', e.target.value)}
          />
        </label>
      </div>
      <div>
        <label htmlFor="accessTokenGrantType">
          Grant type:
          <input
            type="text"
            id="accessTokenGrantType"
            value={options.grantType}
            onChange={(e): void => onChange('grantType', e.target.value)}
          />
        </label>
      </div>
    </form>
  );
};

export default AccessTokenForm;
