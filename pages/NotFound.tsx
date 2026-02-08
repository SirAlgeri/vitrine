import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-xl text-slate-400 mb-8">Página não encontrada</p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
      >
        Voltar para o início
      </Link>
    </div>
  );
};
