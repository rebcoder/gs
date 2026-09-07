export type SaleDateFilter = 'any' | 'today' | 'weekend' | 'upcoming';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MarketplaceItem {
  id: number;
  saleId: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

export interface MarketplaceSale {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  timeLabel: string;
  area: string;
  city: string;
  locationLabel: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  featured: boolean;
  imageUrl: string;
  items: MarketplaceItem[];
  topItems: string[];
  raw: Record<string, unknown>;
}

export interface MarketplaceFilters {
  query: string;
  date: SaleDateFilter;
  distanceKm: number | null;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface VisitPlanEntry {
  saleId: number;
  saleTitle: string;
  saleLocation: string;
  saleLatitude: number | null;
  saleLongitude: number | null;
  itemId: number;
  itemName: string;
  itemDescription: string;
  itemPrice: number;
  itemImageUrl: string;
  addedAt: string;
}

export interface VisitPlanGroup {
  saleId: number;
  saleTitle: string;
  saleLocation: string;
  saleLatitude: number | null;
  saleLongitude: number | null;
  items: VisitPlanEntry[];
}
