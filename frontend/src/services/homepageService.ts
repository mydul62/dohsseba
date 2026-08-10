import { fetchApi } from '@/lib/api-client';

export interface HeroSlideData {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  badge?: string;
  discountPercentage?: number;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

export interface PromoCardData {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  discount?: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

export interface FeaturedShortcutData {
  id: string;
  title: string;
  icon: string;
  link: string;
  category?: string;
  priority: number;
  isActive: boolean;
}

export interface LocationData {
  id: string;
  name: string;
  slug: string;
  city: string;
  isAvailable: boolean;
  priority: number;
}

export interface HomepageFullResponse {
  heroSlides: HeroSlideData[];
  promoCards: PromoCardData[];
  featuredShortcuts: FeaturedShortcutData[];
  locations: LocationData[];
}

export const homepageService = {
  // Server-side GET full aggregated homepage system
  getFullHomepageDataServer: async (): Promise<HomepageFullResponse> => {
    try {
      const { fetchServerApi } = await import('@/lib/server-api');
      const res = await fetchServerApi<HomepageFullResponse>('/homepage/full', {
        next: { revalidate: 60 },
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch (_) {}

    return homepageService.getFullHomepageData();
  },

  // Public GET full aggregated homepage system
  getFullHomepageData: async (): Promise<HomepageFullResponse> => {
    try {
      const res = await fetchApi<HomepageFullResponse>('/homepage/full');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (_) {}

    // Fallback if backend API is temporarily offline
    return {
      heroSlides: [
        {
          id: 'hs_1',
          title: 'Pure Farm Milk & Organic Daily Eggs',
          subtitle: 'Pure organic dairy & daily essentials delivered straight to your door in 45 minutes.',
          buttonText: 'Order Now',
          buttonLink: '/category/dairy-eggs-bakery',
          backgroundImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1000&auto=format&fit=crop&q=80',
          badge: 'Daily Fresh Farm Market',
          discountPercentage: 15,
          isActive: true,
          order: 0,
        },
        {
          id: 'hs_2',
          title: 'Farm Fresh Organic Vegetables & Fruits',
          subtitle: '100% chemical-free organic produce harvested daily for DOHS residents.',
          buttonText: 'Explore Produce',
          buttonLink: '/category/fresh-fruits-vegetables',
          backgroundImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1000&auto=format&fit=crop&q=80',
          badge: '100% Organic',
          discountPercentage: 20,
          isActive: true,
          order: 1,
        },
      ],
      promoCards: [
        {
          id: 'pc_1',
          title: 'Energy Drinks',
          subtitle: 'SAVE UP TO 35% ON',
          image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
          discount: '-35%',
          buttonText: 'Shop Now',
          buttonUrl: '/category/snacks-beverages-drinks',
          backgroundColor: '#b5d8f7',
          isActive: true,
          order: 0,
        },
        {
          id: 'pc_2',
          title: 'Plant Nuggets',
          subtitle: 'GET DISCOUNT -15% ON',
          image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop&q=80',
          discount: '-15%',
          buttonText: 'Buy Now',
          buttonUrl: '/category/meat-fish-seafood',
          backgroundColor: '#f9da8b',
          isActive: true,
          order: 1,
        },
      ],
      featuredShortcuts: [
        {
          id: 'fs_1',
          title: '-35% on Energy Drinks',
          icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop&q=80',
          link: '/category/snacks-beverages-drinks',
          category: 'Beverages',
          priority: 0,
          isActive: true,
        },
        {
          id: 'fs_2',
          title: 'New Frozen Veg',
          icon: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=80',
          link: '/category/fresh-fruits-vegetables',
          category: 'Vegetables',
          priority: 1,
          isActive: true,
        },
        {
          id: 'fs_3',
          title: 'Save up 30% on milk',
          icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&auto=format&fit=crop&q=80',
          link: '/category/dairy-eggs-bakery',
          category: 'Dairy',
          priority: 2,
          isActive: true,
        },
        {
          id: 'fs_4',
          title: 'Free Delivery',
          icon: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&auto=format&fit=crop&q=80',
          link: '/offers',
          category: 'Offers',
          priority: 3,
          isActive: true,
        },
      ],
      locations: [
        { id: 'loc_1', name: 'Savar DOHS', slug: 'savar-dohs', city: 'Dhaka', isAvailable: true, priority: 0 },
        { id: 'loc_2', name: 'Mirpur DOHS', slug: 'mirpur-dohs', city: 'Dhaka', isAvailable: true, priority: 1 },
        { id: 'loc_3', name: 'Mohakhali DOHS', slug: 'mohakhali-dohs', city: 'Dhaka', isAvailable: true, priority: 2 },
      ],
    };
  },

  // Admin API Methods
  createHeroSlide: async (data: Partial<HeroSlideData>) => {
    return await fetchApi('/admin/homepage/hero-slides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateHeroSlide: async (id: string, data: Partial<HeroSlideData>) => {
    return await fetchApi(`/admin/homepage/hero-slides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteHeroSlide: async (id: string) => {
    return await fetchApi(`/admin/homepage/hero-slides/${id}`, {
      method: 'DELETE',
    });
  },

  createPromoCard: async (data: Partial<PromoCardData>) => {
    return await fetchApi('/admin/homepage/promo-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePromoCard: async (id: string, data: Partial<PromoCardData>) => {
    return await fetchApi(`/admin/homepage/promo-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePromoCard: async (id: string) => {
    return await fetchApi(`/admin/homepage/promo-cards/${id}`, {
      method: 'DELETE',
    });
  },

  // Shortcuts CRUD
  createShortcut: async (data: Partial<FeaturedShortcutData>) => {
    return await fetchApi('/admin/homepage/shortcuts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateShortcut: async (id: string, data: Partial<FeaturedShortcutData>) => {
    return await fetchApi(`/admin/homepage/shortcuts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteShortcut: async (id: string) => {
    return await fetchApi(`/admin/homepage/shortcuts/${id}`, {
      method: 'DELETE',
    });
  },

  // Locations CRUD
  createLocation: async (data: Partial<LocationData>) => {
    return await fetchApi('/admin/homepage/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateLocation: async (id: string, data: Partial<LocationData>) => {
    return await fetchApi(`/admin/homepage/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteLocation: async (id: string) => {
    return await fetchApi(`/admin/homepage/locations/${id}`, {
      method: 'DELETE',
    });
  },
};
