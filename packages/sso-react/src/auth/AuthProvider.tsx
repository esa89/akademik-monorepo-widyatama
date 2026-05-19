import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserManager, User, UserManagerSettings } from 'oidc-client-ts';
import { SessionUser, GROUP_ROLE_MAP } from '@widyatama/sso-types';

export interface AuthContextType {
  user: SessionUser | null;
  oidcUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  config: UserManagerSettings;
  onSigninCallback?: (user: User | void) => void;
}

export function AuthProvider({ 
  children, 
  config, 
  onSigninCallback 
}: AuthProviderProps) {
  const [userManager] = useState(() => new UserManager(config));
  const [oidcUser, setOidcUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle redirect callback
    if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
      userManager.signinRedirectCallback().then((user) => {
        if (onSigninCallback) {
          onSigninCallback(user);
        } else {
          // Remove query params from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }).catch((error) => {
        console.error('Signin callback error:', error);
      });
    }

    // Load user from storage
    userManager.getUser().then((user) => {
      setOidcUser(user || null);
      setIsLoading(false);
    });

    // Listen for user changes
    const handleUserLoaded = (user: User) => setOidcUser(user);
    const handleUserUnloaded = () => setOidcUser(null);
    const handleUserSignedOut = () => setOidcUser(null);

    userManager.events.addUserLoaded(handleUserLoaded);
    userManager.events.addUserUnloaded(handleUserUnloaded);
    userManager.events.addUserSignedOut(handleUserSignedOut);

    return () => {
      userManager.events.removeUserLoaded(handleUserLoaded);
      userManager.events.removeUserUnloaded(handleUserUnloaded);
      userManager.events.removeUserSignedOut(handleUserSignedOut);
    };
  }, [userManager, onSigninCallback]);

  const sessionUser: SessionUser | null = React.useMemo(() => {
    if (!oidcUser?.profile) return null;

    const profile = oidcUser.profile;
    const groups = (profile.groups as string[]) || [];
    const roles = groups
      .map((group) => GROUP_ROLE_MAP[group.toLowerCase()])
      .filter((role): role is NonNullable<typeof role> => role !== undefined);

    return {
      id: profile.sub || '',
      email: profile.email || '',
      name: profile.name || profile.preferred_username || '',
      roles,
      groups,
      metadata: {
        preferredUsername: profile.preferred_username,
        givenName: profile.given_name,
        familyName: profile.family_name,
      },
    };
  }, [oidcUser]);

  const login = async () => {
    await userManager.signinRedirect();
  };

  const logout = async () => {
    await userManager.signoutRedirect();
  };

  const getAccessToken = () => {
    return oidcUser?.access_token || null;
  };

  const value: AuthContextType = {
    user: sessionUser,
    oidcUser,
    isAuthenticated: !!oidcUser && !oidcUser.expired,
    isLoading,
    login,
    logout,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
