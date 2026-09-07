import { TestBed } from '@angular/core/testing';
import { MarketplaceService } from './marketplace.service';
import { SalesService } from './sales.service';
import { of } from 'rxjs';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let sales: jasmine.SpyObj<SalesService>;

  beforeEach(() => {
    sales = jasmine.createSpyObj<SalesService>('SalesService', [
      'getGarageSales',
      'searchGarageSales',
      'getFeaturedGarageSales',
      'getNearbyGarageSales',
      'getGarageSaleById',
      'resolveImageUrl',
    ]);
    sales.resolveImageUrl.and.callFake((url: string) => url);

    TestBed.configureTestingModule({
      providers: [
        MarketplaceService,
        { provide: SalesService, useValue: sales }
      ]
    });

    service = TestBed.inject(MarketplaceService);
    window.localStorage.clear();
  });

  it('maps sale and items with fallbacks', (done) => {
    sales.getGarageSaleById.and.returnValue(of({
      id: 1,
      saleName: 'My sale',
      description: 'd',
      saleDate: '2026-01-01',
      startTime: '09:00',
      endTime: '10:00',
      area: 'A',
      city: 'C',
      latitude: 10,
      longitude: 20,
      items: [{ id: 7, name: 'Item', description: 'i', price: 5, category: 'OTHER', imageUrl: '/x.png' }]
    }));

    service.getSaleById(1).subscribe((mapped) => {
      expect(mapped.id).toBe(1);
      expect(mapped.title).toBe('My sale');
      expect(mapped.items.length).toBe(1);
      expect(mapped.items[0].id).toBe(7);
      done();
    });
  });

  it('applies query filter over title and items', () => {
    const salesList = [
      { id: 1, title: 'Vintage stuff', description: '', locationLabel: 'A', topItems: [], items: [], date: '', startTime: '', endTime: '', timeLabel: '', area: '', city: '', latitude: null, longitude: null, distanceKm: null, featured: false, imageUrl: '', raw: {} },
      { id: 2, title: 'Other', description: '', locationLabel: 'A', topItems: [], items: [{ id: 1, saleId: 2, name: 'Lamp', description: '', price: 1, category: 'HOME_DECOR', imageUrl: '' }], date: '', startTime: '', endTime: '', timeLabel: '', area: '', city: '', latitude: null, longitude: null, distanceKm: null, featured: false, imageUrl: '', raw: {} },
    ];

    const filtered = service.applyFilters(salesList as any, { query: 'lamp', date: 'any', distanceKm: null, category: null, minPrice: null, maxPrice: null });
    expect(filtered.map(s => s.id)).toEqual([2]);
  });

  it('stores and toggles saved sales', () => {
    expect(service.isSaleSaved(1)).toBeFalse();
    expect(service.toggleSavedSale(1)).toBeTrue();
    expect(service.isSaleSaved(1)).toBeTrue();
    expect(service.toggleSavedSale(1)).toBeFalse();
    expect(service.isSaleSaved(1)).toBeFalse();
  });
});

