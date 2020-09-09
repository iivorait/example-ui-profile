import { User } from 'oidc-client';

import userManager from './userManager';

export default function(): Promise<User> {
  console.log('will load user');
  return new Promise(async (resolve, reject) => {
    const user = await userManager.getUser();
    if (user && !user.expired) {
      resolve(user);
    } else {
      reject();
    }
  });
}
