import React from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { UnifiedAuth } from '../components/UnifiedAuth';
import { customerAuth } from '../services/customerAuth';

interface AuthPageProps {
  onCustomerSuccess: () => void;
  onAdminSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onCustomerSuccess, onAdminSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  return (
    <UnifiedAuth
      onBack={() => window.history.back()}
      onCustomerSuccess={() => {
        onCustomerSuccess();
        if (redirect) {
          navigate(redirect);
        }
      }}
      onAdminSuccess={onAdminSuccess}
    />
  );
};
