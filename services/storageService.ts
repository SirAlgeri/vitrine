import { AppConfig, Product, CartItem } from '../types';

const KEYS = {
  PRODUCTS: 'vitrine_products',
  CONFIG: 'vitrine_config',
  AUTH: 'vitrine_auth',
  CART: 'vitrine_cart'
};

const DEFAULT_CONFIG: AppConfig = {
  primaryColor: '#3b82f6', // Blue-500
  secondaryColor: '#10b981', // Emerald-500
  storeName: 'VitrinePro'
};

export const StorageService = {
  getProducts: (): Product[] => {
    try {
      const data = localStorage.getItem(KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading products', e);
      return [];
    }
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCart: (): CartItem[] => {
    try {
      const data = localStorage.getItem(KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCart: (cart: CartItem[]) => {
    localStorage.setItem(KEYS.CART, JSON.stringify(cart));
  },

  getConfig: (): AppConfig => {
    try {
      const data = localStorage.getItem(KEYS.CONFIG);
      return data ? JSON.parse(data) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig: (config: AppConfig) => {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  },

  // Simple Image Compression to avoid LocalStorage limits
  compressImage: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compress to JPEG at 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }
};
