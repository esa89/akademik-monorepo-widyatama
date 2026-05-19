import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

/**
 * Login button component
 * @example
 * <LoginButton className="btn btn-primary">
 *   Sign In
 * </LoginButton>
 */
export function LoginButton({ 
  className = 'btn btn-primary', 
  children = 'Login',
  onClick 
}: LoginButtonProps) {
  const { login, isAuthenticated, isLoading } = useAuth();

  const handleClick = () => {
    if (onClick) onClick();
    login();
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <button 
      onClick={handleClick} 
      className={className}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
