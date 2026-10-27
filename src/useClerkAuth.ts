import { useAuth, useUser } from '@clerk/react';

export function useClerkAuth() {
  const auth = useAuth();
  const user = useUser();

  return {
    isSignedIn: !!auth.isSignedIn,
    firstName: user.user?.firstName || null,
    getToken: auth.getToken,
  };
}
