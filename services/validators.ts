export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  return digit === parseInt(cpf.charAt(10));
};

export const formatCPF = (value: string): string => {
  const cpf = value.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCEP = (value: string): string => {
  const cep = value.replace(/[^\d]/g, '');
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const formatPhone = (value: string): string => {
  const phone = value.replace(/[^\d]/g, '');
  if (phone.length <= 2) return `+${phone}`;
  if (phone.length <= 4) return `+${phone.slice(0, 2)} (${phone.slice(2)}`;
  if (phone.length <= 9) return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4)}`;
  if (phone.length <= 10) return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
  return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9, 13)}`;
};

export const fetchAddressByCEP = async (cep: string) => {
  const cleanCEP = cep.replace(/[^\d]/g, '');
  if (cleanCEP.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return {
      endereco: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf
    };
  } catch {
    return null;
  }
};
