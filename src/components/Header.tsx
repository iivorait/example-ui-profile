import React, { useState } from 'react';
import { Navigation } from 'hds-react';

import { useKeycloak } from '../clients/keycloak';
// import { useTranslation } from 'react-i18next';

type LanguageOption = { code: string; label: string };

const Header = () => {
  const languageOptions = [
    { code: 'fi', label: 'Suomi' },
    { code: 'sv', label: 'Svenska' },
    { code: 'en', label: 'English' },
  ];
  /*const { i18n } = useTranslation();
  const setLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };*/
  const keycloak = useKeycloak();
  const authenticated = keycloak.isAuthenticated();
  const initialized = keycloak.isInitialized();
  const user = keycloak.getUserProfile();

  console.log('user initialized?', initialized, user);
  const [language, setLanguage] = useState(languageOptions[0]);
  const [active, setActive] = useState<'link' | 'button' | 'dropdown'>();

  // show helsingfors logo if swedish is selected as the language
  const logoLanguage = language.code === 'sv' ? 'sv' : 'fi';

  const title =
    language.code === 'sv'
      ? 'Helsingfors Systembolaget'
      : 'Helsinki Design System';

  // formats the selected value
  const formatSelectedValue = ({ code }: LanguageOption): string =>
    code.toUpperCase();

  // formats each option label
  const formatOptionLabel = ({ code, label }: LanguageOption): string =>
    `${label} (${code.toUpperCase()})`;

  return (
    <Navigation
      fixed={false}
      logoLanguage={logoLanguage}
      menuCloseAriaLabel="Close menu"
      menuOpenAriaLabel="Open menu"
      theme={'white'}
      title={title}
      titleUrl="https://hel.fi"
      skipTo="#content"
      skipToContentLabel="Skip to main content"
    >
      {/* NAVIGATION ROW */}
      <Navigation.Row display={'inline'}>
        <Navigation.Item
          active={active === 'link'}
          label="Link"
          tabIndex={0}
          onClick={() => setActive('link')}
        />
        <Navigation.Item
          active={active === 'button'}
          as="button"
          label="Button"
          type="button"
          onClick={() => setActive('button')}
        />
        <Navigation.Dropdown active={active === 'dropdown'} label="Dropdown">
          <Navigation.Item
            label="Link to hel.fi"
            href="https://hel.fi"
            target="_blank"
          />
          <Navigation.Item
            as="button"
            type="button"
            onClick={() => setActive('dropdown')}
            label="Make dropdown active"
          />
        </Navigation.Dropdown>
      </Navigation.Row>

      {/* NAVIGATION ACTIONS */}
      <Navigation.Actions>
        {/* SEARCH */}
        <Navigation.Search
          searchLabel="Search"
          searchPlaceholder="Search page"
        />

        {/* USER */}
        {initialized && (
          <Navigation.User
            authenticated={authenticated}
            label="Sign in"
            onSignIn={() => keycloak.login()}
            userName={user ? `${user.firstName} ${user.lastName}` : '___'}
          >
            <Navigation.Item
              label="Your profile"
              href="https://hel.fi"
              target="_blank"
              variant="primary"
            />
            <Navigation.Item
              as="button"
              type="button"
              onClick={() => keycloak.logout()}
              variant="secondary"
              label="Sign out"
            />
          </Navigation.User>
        )}

        {/* LANGUAGE SELECTOR */}
        <Navigation.LanguageSelector
          ariaLabel="Selected language"
          options={languageOptions}
          formatSelectedValue={formatSelectedValue}
          formatOptionLabel={formatOptionLabel}
          onLanguageChange={setLanguage}
          value={language}
        />
      </Navigation.Actions>
    </Navigation>
  );
};

export default Header;
