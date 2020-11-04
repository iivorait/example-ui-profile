import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client';
import { FetchError } from '../clients';

export type GraphQLClient = ApolloClient<NormalizedCacheObject>;
export type GraphQLClientError = Pick<FetchError, 'error' | 'message'>;

export function createGraphQLClient(uri: string, token: string): GraphQLClient {
  return new ApolloClient({
    uri,
    cache: new InMemoryCache(),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Language': 'fi'
    }
  });
}

export async function resetClient(graphQLClient: GraphQLClient): Promise<void> {
  graphQLClient.stop();
  await graphQLClient.resetStore();
}
