import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { OrderStatus, ORDER_STATUS_LABELS, PaymentStatus, PAYMENT_STATUS_LABELS } from '../shared/constants/status';

interface ManualOrderFormProps {
  onClose: () => void;
  onSave: () => void;
}

export const ManualOrderForm: React.FC<ManualOrderFormProps> = ({ onClose, onSave }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    nome_completo: '',
    telefone: '',
    cpf: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    payment_method: 'PIX',
    payment_status: PaymentStatus.APPROVED,
    order_status: OrderStatus.PAID,
    purchase_date: new Date().toISOString().split('T')[0],
    total: 0,
    items: [] as any[]
  });

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  const loadCustomers = async () => {
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers(data);
  };

  const loadProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === 'new') {
      setShowNewCustomer(true);
      setFormData({
        ...formData,
        customer_id: '',
        customer_name: '',
        customer_phone: '',
        customer_address: ''
      });
      return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: customer.nome_completo,
        customer_phone: customer.telefone,
        customer_address: `${customer.endereco}, ${customer.numero}${customer.complemento ? ' - ' + customer.complemento : ''} - ${customer.bairro}, ${customer.cidade}/${customer.estado}`
      });
    }
  };

  const createCustomer = async () => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      const customer = await res.json();
      
      // Montar endereço completo se houver dados
      let address = '';
      if (customer.endereco) {
        address = `${customer.endereco}${customer.numero ? ', ' + customer.numero : ''}${customer.complemento ? ' - ' + customer.complemento : ''}${customer.bairro ? ' - ' + customer.bairro : ''}${customer.cidade ? ', ' + customer.cidade : ''}${customer.estado ? '/' + customer.estado : ''}`;
      }
      
      setFormData({
        ...formData,
        customer_id: customer.id,
        customer_name: customer.nome_completo,
        customer_phone: customer.telefone || '',
        customer_address: address
      });
      
      await loadCustomers();
      setShowNewCustomer(false);
      setNewCustomer({
        nome_completo: '',
        telefone: '',
        cpf: '',
        email: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: ''
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao criar cliente');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', product_name: '', product_price: 0, quantity: 1, subtotal: 0 }]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'product_id') {
      // Buscar por ID exato ou por nome
      const product = products.find(p => 
        String(p.id) === String(value) || 
        p.name.toLowerCase() === value.toLowerCase() ||
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      if (product) {
        newItems[index].product_id = product.id;
        newItems[index].product_name = product.name;
        newItems[index].product_price = parseFloat(product.price);
        newItems[index].product_image = product.image;
        newItems[index].subtotal = parseFloat(product.price) * newItems[index].quantity;
      } else {
        // Se não encontrou, mantém o texto digitado
        newItems[index].product_name = value;
      }
    }
    
    if (field === 'quantity' || field === 'product_price') {
      newItems[index].subtotal = (newItems[index].product_price || 0) * (newItems[index].quantity || 1);
    }
    
    const total = newItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setFormData({ ...formData, items: newItems, total });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
    setFormData({ ...formData, items: newItems, total });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          payment_provider_status: formData.payment_status,
          frete_servico: null,
          frete_valor: 0,
          frete_prazo: null,
          created_at: formData.purchase_date + 'T00:00:00'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar pedido');
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao criar pedido');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Registro Manual de Pedido</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Data da Compra */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Data da Compra *</label>
            <input
              type="date"
              required
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Cliente */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Cliente</label>
              <div className="flex gap-2">
                {formData.customer_id && !showNewCustomer && (
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      customer_id: '',
                      customer_name: '',
                      customer_phone: '',
                      customer_address: ''
                    })}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    Trocar Cliente
                  </button>
                )}
                {!showNewCustomer && (
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(true)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    + Novo Cliente
                  </button>
                )}
              </div>
            </div>
            
            {showNewCustomer ? (
              <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nome completo *"
                    required
                    value={newCustomer.nome_completo}
                    onChange={(e) => setNewCustomer({ ...newCustomer, nome_completo: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={newCustomer.telefone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, telefone: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="CPF"
                    value={newCustomer.cpf}
                    onChange={(e) => setNewCustomer({ ...newCustomer, cpf: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="CEP"
                    value={newCustomer.cep}
                    onChange={(e) => setNewCustomer({ ...newCustomer, cep: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Endereço"
                    value={newCustomer.endereco}
                    onChange={(e) => setNewCustomer({ ...newCustomer, endereco: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Número"
                    value={newCustomer.numero}
                    onChange={(e) => setNewCustomer({ ...newCustomer, numero: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Complemento"
                    value={newCustomer.complemento}
                    onChange={(e) => setNewCustomer({ ...newCustomer, complemento: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={newCustomer.bairro}
                    onChange={(e) => setNewCustomer({ ...newCustomer, bairro: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={newCustomer.cidade}
                    onChange={(e) => setNewCustomer({ ...newCustomer, cidade: e.target.value })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Estado"
                    maxLength={2}
                    value={newCustomer.estado}
                    onChange={(e) => setNewCustomer({ ...newCustomer, estado: e.target.value.toUpperCase() })}
                    className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={createCustomer}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded transition-colors"
                  >
                    Salvar Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  required
                  list="customers-list"
                  value={formData.customer_name || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Buscar cliente por nome
                    const customer = customers.find(c => 
                      c.nome_completo.toLowerCase() === value.toLowerCase() ||
                      c.nome_completo.toLowerCase().includes(value.toLowerCase())
                    );
                    if (customer) {
                      handleCustomerChange(customer.id);
                    } else {
                      // Mantém o texto digitado
                      setFormData({
                        ...formData,
                        customer_id: '',
                        customer_name: value,
                        customer_phone: '',
                        customer_address: ''
                      });
                    }
                  }}
                  placeholder="Digite para buscar cliente..."
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
                />
                <datalist id="customers-list">
                  {customers.map(c => (
                    <option key={c.id} value={c.nome_completo}>
                      {c.telefone}
                    </option>
                  ))}
                </datalist>
              </>
            )}
          </div>

          {/* Produtos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Produtos</label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
              >
                <Plus className="w-4 h-4" />
                Adicionar Produto
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-slate-700 p-3 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        required
                        list={`products-${index}`}
                        value={item.product_name || ''}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        placeholder="Digite para buscar produto..."
                        className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                      />
                      <datalist id={`products-${index}`}>
                        {products.map(p => (
                          <option key={p.id} value={p.name}>ID: {p.id} - {p.name} - R$ {p.price}</option>
                        ))}
                      </datalist>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-400 hover:text-red-300 self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Preço</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.product_price || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          updateItem(index, 'product_price', value);
                        }}
                        className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Qtd</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary text-sm"
                        placeholder="1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Subtotal</label>
                      <div className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 font-medium text-sm">
                        R$ {(item.subtotal || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagamento e Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Método de Pagamento</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
              >
                <option value="PIX">PIX</option>
                <option value="CARD">Cartão</option>
                <option value="BOLETO">Boleto</option>
                <option value="DINHEIRO">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status do Pagamento</label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as PaymentStatus })}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
              >
                {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status do Pedido</label>
              <select
                value={formData.order_status}
                onChange={(e) => setFormData({ ...formData, order_status: e.target.value as OrderStatus })}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary"
              >
                {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Total do Pedido</span>
              <span className="text-2xl font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.total)}
              </span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formData.items.length === 0 || !formData.customer_id}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
