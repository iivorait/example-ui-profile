import { ClientStatusIds, User } from '..';

export type StoreState = {
  user: User | undefined;
  status: ClientStatusIds;
  authenticated: boolean;
  initialised: boolean;
  error: { type: string; message: string } | undefined;
};
