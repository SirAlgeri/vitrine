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
    images: [],
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = formData.images || [];
    if (currentImages.length >= 10) {
      alert('Máximo de 10 fotos por produto');
      return;
    }

    setIsProcessingImg(true);
    try {
      const newImages = [];
      for (let i = 0; i < Math.min(files.length, 10 - currentImages.length); i++) {
        const base64 = await StorageService.compressImage(files[i]);
        newImages.push(base64);
      }
      
      const allImages = [...currentImages, ...newImages];
      setFormData(prev => ({ 
        ...prev, 
        images: allImages,
        image: allImages[0] || '' // Primeira imagem como principal
      }));
    } catch (error) {
      alert('Erro ao processar imagem. Tente uma foto menor.');
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      images: newImages,
      image: newImages[0] || ''
    }));
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
      images: formData.images || [],
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
            <label className="block text-sm font-medium text-slate-400">
              Fotos do Produto ({(formData.images || []).length}/10)
            </label>
            
            {/* Grid de imagens */}
            {(formData.images || []).length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {(formData.images || []).map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-700 group">
                    <img src={img} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary text-white text-xs rounded">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Botão de upload */}
            {(formData.images || []).length < 10 && (
              <div 
                  className="relative aspect-video rounded-xl border-2 border-dashed border-slate-700 bg-slate-800 overflow-hidden group cursor-pointer transition-colors hover:border-primary"
                  onClick={() => fileInputRef.current?.click()}
              >
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                      {isProcessingImg ? (
                          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                            <>
                                <UploadCloud className="w-10 h-10 mb-2" />
                                <span className="text-sm">Toque para adicionar fotos</span>
                                <span className="text-xs">Até {10 - (formData.images || []).length} fotos</span>
                            </>
                        )}
                    </div>
                </div>
            )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*"
                    multiple
                    className="hidden" 
                />
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
