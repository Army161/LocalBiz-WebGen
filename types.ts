export interface Business {
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  websiteUri?: string; // Optional because the goal is to find ones without it
  type: string;
  placeId?: string;
  summary?: string;
  phone?: string;
  email?: string;
}

export interface WebsiteContent {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
  businessName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutText: string;
  services: Array<{
    title: string;
    description: string;
    icon: 'wrench' | 'star' | 'coffee' | 'scissors' | 'home' | 'car' | 'users' | 'zap'; 
    callout?: string;
  }>;
  testimonials: Array<{
    text: string;
    author: string;
  }>;
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    hours: string;
  };
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fontStyle: 'modern' | 'classic' | 'playful';
  heroImageBase64?: string;
  leadStats?: {
    pageViews: number;
    leadsCaptured: number;
    conversionRate: string;
    outreachEmailsSent: number;
    activeConversations: number;
  };
}

export type AppStep = 'search' | 'results' | 'generating' | 'preview' | 'saved-sites';

export interface SearchHistoryItem {
  query: string;
  location: string;
  timestamp: number;
}