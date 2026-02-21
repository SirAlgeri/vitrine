import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronLeft } from 'lucide-react';
import { FieldDefinition } from '../types';

interface FieldManagerProps {
  onBack: () => void;
}

export const FieldManager: React.FC<FieldManagerProps> = ({ onBack }) => {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [newField, setNewField] = useState({ 
    name: '', 
    type: 'text' as 'text' | 'number' | 'currency' | 'select',
    options: [] as string[]
  });
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    const res = await fetch('/api/field-definitions');
    setFields(await res.json());
  };

  const addField = async () => {
    if (!newField.name.trim()) return;
    if (fields.some(f => f.field_name.toLowerCase() === newField.name.trim().toLowerCase())) {
      alert('Já existe um campo com este nome');
      return;
    }
    if (newField.type === 'select' && newField.options.length === 0) {
      alert('Adicione pelo menos uma opção para o campo de seleção');
      return;
    }
    
    await fetch('/api/field-definitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        field_name: newField.name,
        field_type: newField.type,
        field_order: fields.length,
        options: newField.type === 'select' ? JSON.stringify(newField.options) : null
      })
    });
    setNewField({ name: '', type: 'text', options: [] });
    setOptionInput('');
    loadFields();
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setNewField({ ...newField, options: [...newField.options, optionInput.trim()] });
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setNewField({ ...newField, options: newField.options.filter((_, i) => i !== index) });
  };

  const deleteField = async (id: string) => {
    if (!confirm('Deletar campo?')) return;
    const res = await fetch(`/api/field-definitions/${id}`, { method: 'DELETE' });
    if (res.ok) loadFields();
    else alert('Este campo não pode ser deletado');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Gerenciar Campos dos Produtos</h2>
        <p className="text-slate-400 text-sm">Configure os campos adicionais para seus produtos</p>
      </div>

      <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-slate-300 text-sm mb-2">
          Campos padrões (Nome, Preço, Descrição, Imagem) não podem ser removidos.
        </p>
        <p className="text-slate-400 text-xs">
          Adicione campos customizados como "Tipo", "Material", "Cor", etc.
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Adicionar Novo Campo</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            placeholder="Nome do campo (ex: Marca, Tamanho)"
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
          />
          
          <select
            value={newField.type}
            onChange={(e) => setNewField({ ...newField, type: e.target.value as any, options: [] })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
          >
            <option value="text">Texto</option>
            <option value="number">Número</option>
            <option value="currency">Valor (R$)</option>
            <option value="select">Seleção (opções pré-definidas)</option>
          </select>

          {newField.type === 'select' && (
            <div className="space-y-3 p-4 bg-slate-700 rounded-lg">
              <label className="text-sm font-medium text-slate-300">Opções disponíveis:</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  placeholder="Digite uma opção (ex: Nike)"
                  className="flex-1 px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded"
                >
                  Adicionar
                </button>
              </div>

              {newField.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newField.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-1 px-3 py-1 bg-slate-600 rounded-full text-sm text-white">
                      <span>{option}</span>
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={addField} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Campo
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Campos Cadastrados</h3>
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white font-medium">{field.field_name}</div>
                  <div className="text-slate-400 text-sm">
                    {field.field_type === 'text' && 'Texto'}
                    {field.field_type === 'number' && 'Número'}
                    {field.field_type === 'currency' && 'Valor (R$)'}
                    {field.field_type === 'select' && 'Seleção'}
                    {field.is_default && ' • Campo padrão'}
                  </div>
                  {field.field_type === 'select' && field.options && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.options.map((opt: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {field.can_delete && (
                  <button
                    onClick={() => deleteField(field.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
