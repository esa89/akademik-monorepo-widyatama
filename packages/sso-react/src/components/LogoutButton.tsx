import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

/**
 * Logout button component
 * @example
 * <LogoutButton className="btn btn-secondary">
 *   Sign Out
 * </LogoutButton>
 */
export function LogoutButton({ 
  className = 'btn btn-secondary', 
  children = 'Logout',
  onClick 
}: LogoutButtonProps) {
  const { logout, isAuthenticated, isLoading } = useAuth();

  const handleClick = () => {
    if (onClick) onClick();
    logout();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button 
      onClick={handleClick} 
      className={className}
      disabled={isLoading}
    >
      {children}
    </button>
  );
}
