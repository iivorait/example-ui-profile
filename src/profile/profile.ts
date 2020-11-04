// following ts-ignore + eslint-disable fixes "Could not find declaration file for module" error for await-handler
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import to from 'await-handler';
import { ApolloError } from '@apollo/client';
import { loader } from 'graphql.macro';
import { useCallback, useContext, useEffect, useState } from 'react';
import { FetchStatus, getClient } from '../clients/client';
import {
  GraphQLClient,
  createGraphQLClient,
  GraphQLClientError,
  resetClient
} from '../graphql/graphqlClient';
import { ApiAccessTokenContext } from '../components/ApiAccessTokenProvider';

let profileGqlClient: GraphQLClient;

export type ProfileDataType = string | boolean | null | number | undefined | {};

export type ProfileData = Record<string, ProfileDataType>;
export type ProfileQueryResult = {
  data: {
    myProfile: ProfileData;
  };
};

export type ProfileActions = {
  getProfile: () => ProfileData | GraphQLClientError;
  fetch: () => Promise<ProfileData | GraphQLClientError>;
  getStatus: () => FetchStatus;
  clear: () => Promise<void>;
};

export function getProfileApiToken(): string | undefined {
  const client = getClient();
  const tokenKey = process.env.REACT_APP_PROFILE_AUDIENCE;
  if (!tokenKey) {
    return undefined;
  }
  const apiTokens = client.getApiTokens();
  return apiTokens[tokenKey];
}

export function getProfileGqlClient(): GraphQLClient | undefined {
  if (!profileGqlClient) {
    const token = getProfileApiToken();
    const uri = String(process.env.REACT_APP_PROFILE_BACKEND_URL);
    if (!token || !uri) {
      return undefined;
    }
    profileGqlClient = createGraphQLClient(uri, token);
  }
  return profileGqlClient;
}

export function convertQueryToData(
  queryResult: ProfileQueryResult
): ProfileData | undefined {
  const profile = queryResult && queryResult.data && queryResult.data.myProfile;
  if (!profile) {
    return undefined;
  }
  const { id, firstName, lastName, nickname, language } = profile;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getEmail = (data: any): string | undefined => {
    const list = data?.emails?.edges;
    return list && list[0] && list[0].node?.email;
  };
  return {
    id,
    firstName,
    lastName,
    nickname,
    language,
    email: getEmail(profile)
  };
}

export async function getProfileData(): Promise<
  ProfileData | GraphQLClientError
> {
  const client = getProfileGqlClient();
  if (!client) {
    return Promise.resolve({
      error: new Error(
        'getProfileGqlClient returned undefined. Missing ApiToken for env.REACT_APP_PROFILE_AUDIENCE or missing env.REACT_APP_PROFILE_BACKEND_URL '
      )
    });
  }
  const MY_PROFILE_QUERY = loader('../graphql/MyProfileQuery.graphql');
  const [error, result]: [ApolloError, ProfileQueryResult] = await to(
    client.query({
      query: MY_PROFILE_QUERY
    })
  );
  if (error) {
    return {
      error,
      message: 'Query error'
    };
  }
  const data = convertQueryToData(result);
  if (!data) {
    return {
      error: new Error('query result is missing data.myProfile')
    };
  }
  return data as ProfileData;
}

export function useProfile(): ProfileActions {
  const actions = useContext(ApiAccessTokenContext);
  if (!actions) {
    throw new Error(
      'ApiAccessTokenActions not provided from ApiAccessTokenContext. Provide context in React Components with ApiAccessTokenProvider.'
    );
  }
  const { getStatus } = actions;
  const [profileData, setProfileData] = useState<ProfileData | undefined>();
  const apiAccessTokenStatus = getStatus();

  const resolveStatus = (): FetchStatus => {
    if (apiAccessTokenStatus === 'loaded') {
      return 'ready';
    }
    if (
      apiAccessTokenStatus === 'error' ||
      apiAccessTokenStatus === 'unauthorized'
    ) {
      return apiAccessTokenStatus;
    }
    return 'waiting';
  };

  const [status, setStatus] = useState<FetchStatus>(resolveStatus());

  const currentStatus = status === 'waiting' ? resolveStatus() : status;

  const fetchProfile: ProfileActions['fetch'] = useCallback(async () => {
    setStatus('loading');
    const result = await getProfileData();
    if (result.error) {
      setStatus('error');
      setProfileData(undefined);
    } else {
      setProfileData(result as ProfileData);
      setStatus('loaded');
    }
    return result;
  }, []);

  useEffect(() => {
    const autoFetch = async (): Promise<void> => {
      if (currentStatus !== 'ready') {
        return;
      }
      fetchProfile();
    };

    autoFetch();
  }, [apiAccessTokenStatus, currentStatus, fetchProfile, status]);

  return {
    getStatus: () => status,
    getProfile: () => profileData,
    fetch: () => fetchProfile(),
    clear: async () => {
      const client = getProfileGqlClient();
      if (client) {
        await resetClient(client);
      }
      if (profileData) {
        setProfileData(undefined);
      }
    }
  } as ProfileActions;
}
