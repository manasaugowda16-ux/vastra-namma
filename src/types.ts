export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'weaver' | 'admin' | 'regular' | 'customer';
  whatsappNumber?: string;
  createdAt: any;
}

export type SareeCategory = 'Silk' | 'Cotton' | 'Designer' | 'Wedding' | 'Karnataka Traditional';

export interface Trend {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  colorPalette?: string[];
  createdAt: any;
}

export interface SareeGalleryItem {
  id: string;
  imageUrl: string;
  imageUrls?: string[];
  weaverId: string;
  weaverName: string;
  price: number;
  sareeType: 'Ilkal' | 'Molakalmuru' | SareeCategory;
  category: SareeCategory;
  description?: string;
  whatsappNumber?: string;
  createdAt: any;
  fabricType?: string;
}

export interface CartItem extends SareeGalleryItem {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: any;
  shippingAddress?: string;
}
