import { ClientStatusId, User } from '..';

export type StoreState = {
  user: User | undefined;
  status: ClientStatusId;
  authenticated: boolean;
  initialised: boolean;
  error: { type: string; message: string } | undefined;
};
