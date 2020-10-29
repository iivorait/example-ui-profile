import React from 'react';
import { useClient } from '../clients/client';

const Profile = (): React.ReactElement => {
  const client = useClient();
  const audience = process.env.REACT_APP_PROFILE_AUDIENCE;
  // const url = process.env.REACT_APP_PROFILE_BACKEND_URL;
  const tokens = client.getApiTokens();
  const profileAccessToken = audience && tokens[audience];
  return (
    <div>
      <h2>Profile access token:</h2>
      <p>{profileAccessToken}</p>
    </div>
  );
};

export default Profile;
