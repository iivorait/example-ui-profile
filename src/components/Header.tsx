import React, { useState } from 'react';
import { Navigation } from 'hds-react';
import { useHistory, useLocation } from 'react-router-dom';
import { useClient } from '../clients/client';

type Page = 'frontpage' | 'apiAccessTokens' | 'userTokens' | 'profile';

const Header = (): React.ReactElement => {
  const client = useClient();
  const authenticated = client.isAuthenticated();
  const initialized = client.isInitialized();
  const user = client.getUser();
  const history = useHistory();
  const location = useLocation();
  const currentPageFromPath: Page =
    location.pathname && location.pathname.length > 1
      ? (location.pathname.substr(1) as Page)
      : 'frontpage';
  const [active, setActive] = useState<Page>(currentPageFromPath);

  const title = 'Helsinki Profiili Example';
  const userName = user ? `${user.given_name} ${user.family_name}` : '';

  return (
    <Navigation
      fixed={false}
      logoLanguage="fi"
      menuCloseAriaLabel="Close menu"
      menuOpenAriaLabel="Open menu"
      theme="white"
      title={title}
      titleUrl="https://hel.fi"
      skipTo="#content"
      skipToContentLabel="Skip to main content">
      <Navigation.Row display="inline">
        <Navigation.Item
          active={active === 'frontpage'}
          label="Etusivu"
          tabIndex={0}
          onClick={(): void => {
            setActive('frontpage');
            history.push('/');
          }}
        />
        <Navigation.Item
          active={active === 'apiAccessTokens'}
          as="button"
          label="Hae API access token"
          type="button"
          onClick={(): void => {
            setActive('apiAccessTokens');
            history.push('/apiAccessTokens');
          }}
        />
        <Navigation.Item
          active={active === 'userTokens'}
          as="button"
          label="Tokenit"
          type="button"
          onClick={(): void => {
            setActive('userTokens');
            history.push('/userTokens');
          }}
        />
        <Navigation.Item
          active={active === 'profile'}
          as="button"
          label="Profiili"
          type="button"
          onClick={(): void => {
            setActive('profile');
            history.push('/profile');
          }}
        />
      </Navigation.Row>
      <Navigation.Actions>
        {initialized && (
          <Navigation.User
            authenticated={authenticated}
            label="Sign in"
            onSignIn={(): void => client.login()}
            userName={userName}>
            <Navigation.Item
              label={userName}
              href="https://hel.fi"
              target="_blank"
              variant="primary"
            />
            <Navigation.Item
              as="button"
              type="button"
              onClick={(): void => client.logout()}
              variant="secondary"
              label="Sign out"
            />
          </Navigation.User>
        )}
      </Navigation.Actions>
    </Navigation>
  );
};

export default Header;
