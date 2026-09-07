import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DiscoverComponent } from './discover.component';
import { MarketplaceService } from '../../services/marketplace.service';
import { ProfileService } from '../../services/profile.service';
import { MarketplaceSale } from '../../models/marketplace.models';

describe('DiscoverComponent', () => {
  let marketplace: jasmine.SpyObj<MarketplaceService>;
  let profile: jasmine.SpyObj<ProfileService>;

  const fakeSale: MarketplaceSale = {
    id: 1,
    title: 'Sample Sale',
    description: 'desc',
    date: '2026-01-01',
    startTime: '09:00',
    endTime: '10:00',
    timeLabel: '09:00 - 10:00',
    area: 'Area',
    city: 'City',
    locationLabel: 'Area, City',
    latitude: 10,
    longitude: 20,
    distanceKm: null,
    featured: false,
    imageUrl: '',
    items: [],
    topItems: [],
    raw: {}
  };

  beforeEach(async () => {
    marketplace = jasmine.createSpyObj<MarketplaceService>('MarketplaceService', [
      'getAllSales',
      'withDistance',
      'getCategories',
      'applyFilters',
      'toggleSavedSale',
      'isSaleSaved'
    ]);
    marketplace.getAllSales.and.returnValue(of([fakeSale]));
    marketplace.withDistance.and.callFake((sales) => sales);
    marketplace.getCategories.and.returnValue([]);
    marketplace.applyFilters.and.callFake((sales) => sales);
    marketplace.isSaleSaved.and.returnValue(false);

    profile = jasmine.createSpyObj<ProfileService>('ProfileService', ['getMyProfile']);
    profile.getMyProfile.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [DiscoverComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MarketplaceService, useValue: marketplace },
        { provide: ProfileService, useValue: profile },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ]
    }).compileComponents();
  });

  it('creates and loads sales from MarketplaceService', () => {
    const fixture = TestBed.createComponent(DiscoverComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(marketplace.getAllSales).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(component.filteredSales.length).toBe(1);
    expect(component.filteredSales[0].title).toBe('Sample Sale');

    fixture.destroy();
  });
});
