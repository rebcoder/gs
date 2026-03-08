# Changelog

## Unreleased

### Backend (Spring Boot)
- Added `Appointment` improvements:
  - Derive buyer from authenticated JWT in `AppointmentController#createAppointment` (prevent trusting client-supplied buyerId).
  - Added `/api/appointments/slot-count` endpoint to query slot counts for a given sale/time/date.
  - Added `/api/appointments/notify-item-removed` dev endpoint to notify about item removals.
  - Enforced slot capacity (max 3) in `AppointmentServiceImpl#createAppointment`; 4th booking returns error.
  - Populated `AppointmentDto` with display fields: `buyerName`, `sellerName`, `homeArea`, `homeCity`, `homeLatitude`, `homeLongitude`.
  - Implemented buyer appointment listing (`getAppointmentsByUser`) and appointment updates (status changes).

### Frontend (Angular)
- Booking UI:
  - `book-appointment` no longer sends `buyerId` (server reads buyer from JWT).
  - Added slot availability check and `slotsLeft` indicator; prevents booking if slot is full.
- Auth / Demo UX:
  - Added demo login buttons (`demo_buyer` / `demo_seller`) to login page for quick testing.
- Appointments UI:
  - Implemented buyer/seller appointments listing and cancel/confirm actions.

### Tests & Scripts
- Added API-driven E2E verification scripts to seed demo data and validate booking + approval flows.
- Added capacity test script that verifies 4th booking fails when 3 appointments exist for same slot.

### Dev utils
- Added `/api/test/demo-info` to expose demo entity IDs for local debugging.


## Notes
- H2 in-memory DB is used for dev; demo seeding endpoints will create demo users/sales/items.
- JWT tokens now include a `roles` claim where available.
