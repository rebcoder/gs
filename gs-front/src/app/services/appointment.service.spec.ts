import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentService]
    });

    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call createAppointment with correct payload', () => {
    const payload = { saleId: 1, appointmentTime: new Date().toISOString() };
    service.createAppointment(payload).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/appointments'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true });
  });

  it('should call updateStatus with correct URL', () => {
    service.updateStatus(42, 'CONFIRMED').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/seller/appointments/42/status'));
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should call getSlotCount and return number', () => {
    const saleId = 5;
    const timeSlot = '09:00';
    const dateIso = '2025-08-26';

    let result: any;
    service.getSlotCount(saleId, timeSlot, dateIso).subscribe((res) => result = res);

    const req = httpMock.expectOne((r) => r.url.includes('/appointments/slot-count'));
    expect(req.request.method).toBe('GET');
    // return numeric value
    req.flush(2);
    expect(result).toBe(2);
  });

  it('should call notifyItemRemoved with correct body', () => {
    const saleId = 3;
    const itemId = 7;
    service.notifyItemRemoved(saleId, itemId).subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/appointments/notify-item-removed'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ saleId, itemId });
    req.flush({ notified: true });
  });
});



