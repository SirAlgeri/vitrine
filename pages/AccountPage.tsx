import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CustomerAccount } from '../components/CustomerAccount';
import { Customer } from '../types';
import { customerAuth } from '../services/customerAuth';

interface AccountPageProps {
  customer: Customer | null;
  onLogout: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ customer, onLogout }) => {
  const navigate = useNavigate();

  if (!customer) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <CustomerAccount 
      customer={customer}
      onBack={() => navigate('/')}
      onLogout={onLogout}
    />
  );
};
