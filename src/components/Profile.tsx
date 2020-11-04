import React, { useContext } from 'react';
import { Button } from 'hds-react';
import { ApiAccessTokenActions } from '../clients/client';
import { ProfileDataType, useProfile } from '../profile/profile';
import { ApiAccessTokenContext } from './ApiAccessTokenProvider';
import styles from './styles.module.css';

const PropToComponent = ([prop, value]: [
  string,
  ProfileDataType
]): React.ReactElement => {
  return (
    <li key={prop}>
      <strong>{prop}</strong>: {value}
    </li>
  );
};

const Profile = (): React.ReactElement => {
  const actions = useContext(ApiAccessTokenContext) as ApiAccessTokenActions;
  const { getStatus: getApiAccessTokenStatus } = actions;
  const {
    getStatus: getProfileStatus,
    getProfile,
    fetch,
    clear
  } = useProfile();
  const apiAccessTokenStatus = getApiAccessTokenStatus();
  const profileStatus = getProfileStatus();
  const profileData = getProfile();
  const reload = async (): Promise<void> => {
    await clear();
    await fetch();
  };
  if (apiAccessTokenStatus === 'error') {
    return <div>Api access tokenin lataus epäonnistui</div>;
  }
  if (profileStatus === 'error') {
    return <div>Profiilin lataus epäonnistui</div>;
  }
  if (profileStatus !== 'loaded') {
    return <div>Ladataan....</div>;
  }
  return (
    <div>
      <h2>Profiilin tiedot:</h2>
      {profileData && (
        <ul className={styles['user-token-list']}>
          {Object.entries(profileData).map(arr => PropToComponent(arr))}
        </ul>
      )}
      <Button translate="" onClick={reload}>
        Hae
      </Button>
    </div>
  );
};

export default Profile;
