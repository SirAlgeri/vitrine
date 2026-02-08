import React, { useState, useRef, useEffect } from 'react';
import { Product, FieldDefinition } from '../types';
import { StorageService } from '../services/storageService';
import { Camera, Image as ImageIcon, X, ChevronLeft, Save, UploadCloud } from 'lucide-react';

interface ProductFormProps {
  initialProduct?: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    id: '',
    image: '',
    fields: {}
  });
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFields();
    if (initialProduct) {
      setFormData(initialProduct);
    }
  }, [initialProduct]);

  const loadFields = async () => {
    const res = await fetch('http://localhost:3001/api/field-definitions');
    const data = await res.json();
    setFields(data.filter((f: FieldDefinition) => !f.is_default));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImg(true);
    try {
      const base64 = await StorageService.compressImage(file);
      setFormData(prev => ({ ...prev, image: base64 }));
    } catch (error) {
      alert('Erro ao processar imagem. Tente uma foto menor.');
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined) {
      alert('Nome e Preço são obrigatórios');
      return;
    }

    const productToSave: Product = {
      id: formData.id || crypto.randomUUID(),
      name: formData.name,
      price: Number(formData.price),
      description: formData.description || '',
      image: formData.image || '',
      createdAt: initialProduct?.createdAt || Date.now(),
      fields: formData.fields || {}
    };

    onSave(productToSave);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          {initialProduct ? 'Editar Produto' : 'Novo Produto'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Image Upload Area */}
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Foto do Produto</label>
            <div 
                className={`relative aspect-video rounded-xl border-2 border-dashed ${formData.image ? 'border-primary/50' : 'border-slate-700'} bg-slate-800 overflow-hidden group cursor-pointer transition-colors hover:border-primary`}
                onClick={() => fileInputRef.current?.click()}
            >
                {formData.image ? (
                    <>
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white font-medium flex items-center gap-2">
                                <Camera className="w-5 h-5" /> Alterar Foto
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                        {isProcessingImg ? (
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                            <>
                                <UploadCloud className="w-10 h-10 mb-2" />
                                <span className="text-sm">Toque para adicionar foto</span>
                            </>
                        )}
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>
            {formData.image && (
                <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setFormData({...formData, image: ''}); }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                    <X className="w-3 h-3" /> Remover foto atual
                </button>
            )}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">ID (Opcional)</label>
                <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    placeholder="Gerado automaticamente se vazio"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm"
                />
            </div>
             <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">Preço (R$)</label>
                <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-lg font-semibold"
                />
            </div>
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Nome do Produto</label>
            <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Tênis Esportivo Pro"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-lg"
            />
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Descrição Detalhada</label>
            <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva os detalhes, materiais e diferenciais..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none"
            />
        </div>

        {/* Custom Fields */}
        {fields.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white">Campos Adicionais</h3>
            {fields.map(field => (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">{field.field_name}</label>
                {field.field_type === 'text' && (
                  <input
                    type="text"
                    value={formData.fields?.[field.id] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      fields: { ...formData.fields, [field.id]: e.target.value }
                    })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                )}
                {field.field_type === 'number' && (
                  <input
                    type="number"
                    value={formData.fields?.[field.id] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      fields: { ...formData.fields, [field.id]: e.target.value }
                    })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                )}
                {field.field_type === 'currency' && (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fields?.[field.id] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      fields: { ...formData.fields, [field.id]: e.target.value }
                    })}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                )}
                {field.field_type === 'select' && field.options && (
                  <select
                    value={formData.fields?.[field.id] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      fields: { ...formData.fields, [field.id]: e.target.value }
                    })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Selecione...</option>
                    {JSON.parse(field.options).map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sticky Action Bar for Mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur border-t border-slate-800 md:relative md:bg-transparent md:border-0 md:p-0 flex items-center gap-4 z-50">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 md:flex-none py-3 px-6 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
                Cancelar
            </button>
            <button
                type="submit"
                className="flex-[2] md:flex-none py-3 px-8 rounded-lg font-medium text-white bg-primary hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
                <Save className="w-5 h-5" />
                Salvar Produto
            </button>
        </div>

      </form>
    </div>
  );
};
