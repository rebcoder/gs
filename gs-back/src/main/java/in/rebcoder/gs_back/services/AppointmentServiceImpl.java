package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.exception.ResourceNotFoundException;
import in.rebcoder.gs_back.exception.UnauthorizedAccessException;
import in.rebcoder.gs_back.models.AppointmentStatus;
import in.rebcoder.gs_back.repositories.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final in.rebcoder.gs_back.repositories.UserRepository userRepository;
    private final in.rebcoder.gs_back.repositories.HomeRepository homeRepository;
    private final in.rebcoder.gs_back.repositories.SaleRepository saleRepository;
    private final in.rebcoder.gs_back.repositories.ItemRepository itemRepository;

    @Override
    public AppointmentDto createAppointment(AppointmentDto appointmentDto) {
        if (appointmentDto.getBuyerId() == null) {
            throw new IllegalArgumentException("Buyer is required");
        }
        if (appointmentDto.getSaleId() == null) {
            throw new IllegalArgumentException("Sale is required");
        }

        in.rebcoder.gs_back.models.User buyer = userRepository.findById(appointmentDto.getBuyerId())
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found"));
        in.rebcoder.gs_back.models.Sale sale = saleRepository.findById(appointmentDto.getSaleId())
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));

        in.rebcoder.gs_back.models.User seller = sale.getSeller();
        if (seller == null) {
            throw new ResourceNotFoundException("Seller not found for sale");
        }
        if (appointmentDto.getSellerId() != null && !appointmentDto.getSellerId().equals(seller.getId())) {
            throw new IllegalArgumentException("Seller does not match the selected sale");
        }

        in.rebcoder.gs_back.models.Home home = sale.getHome();
        if (appointmentDto.getHomeId() != null && (home == null || !appointmentDto.getHomeId().equals(home.getId()))) {
            throw new IllegalArgumentException("Home does not match the selected sale");
        }
        if (home == null) {
            throw new ResourceNotFoundException("Home not found for sale");
        }
        if (seller.getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Seller cannot book their own sale");
        }
        if (appointmentDto.getAppointmentTime() == null) {
            throw new IllegalArgumentException("Appointment time is required");
        }

        in.rebcoder.gs_back.models.Appointment appointment = new in.rebcoder.gs_back.models.Appointment();
        appointment.setBuyer(buyer);
        appointment.setSeller(seller);
        appointment.setHome(home);
        appointment.setSale(sale);
        appointment.setAppointmentTime(appointmentDto.getAppointmentTime());
        appointment.setTimeSlot(appointmentDto.getTimeSlot());
        appointment.setNotes(appointmentDto.getNotes());
        appointment.setStatus(in.rebcoder.gs_back.models.AppointmentStatus.PENDING);

        // Enforce sale open hours/date. These are client-correctable input errors (bad date/time
        // choice), not server faults - use IllegalArgumentException like the checks above, so
        // GlobalExceptionHandler maps them to 400 instead of a generic 500.
        if (sale.getSaleDate() != null && appointment.getAppointmentTime() != null &&
                !appointment.getAppointmentTime().toLocalDate().equals(sale.getSaleDate())) {
            throw new IllegalArgumentException("Appointment date must match sale date");
        }
        if (appointment.getAppointmentTime() != null && (sale.getStartTime() != null || sale.getEndTime() != null)) {
            java.time.LocalTime t = appointment.getAppointmentTime().toLocalTime();
            if (sale.getStartTime() != null && t.isBefore(sale.getStartTime())) {
                throw new IllegalArgumentException("Appointment time is before sale opening hours");
            }
            if (sale.getEndTime() != null && (t.equals(sale.getEndTime()) || t.isAfter(sale.getEndTime()))) {
                throw new IllegalArgumentException("Appointment time is after sale closing hours");
            }
        }

        // Enforce slot capacity: check availability for this sale/time
        if (!isTimeSlotAvailable(sale.getId(), appointment.getAppointmentTime())) {
            throw new IllegalArgumentException("Time slot is full");
        }

        if (appointmentDto.getInterestedItemIds() != null && !appointmentDto.getInterestedItemIds().isEmpty()) {
            var interestedItems = itemRepository.findAllById(appointmentDto.getInterestedItemIds());
            appointment.setInterestedItems(interestedItems);
        }

        appointment = appointmentRepository.save(appointment);
        return toDto(appointment);
    }

    @Override
    public AppointmentDto updateAppointment(Long id, AppointmentDto appointmentDto) {
        in.rebcoder.gs_back.models.Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        // Update status if provided
        if (appointmentDto.getStatus() != null) {
            try {
                AppointmentStatus status = normalizeStatus(appointmentDto.getStatus());
                if (status != null) {
                    appt.setStatus(status);
                }
            } catch (IllegalArgumentException ignored) {}
        }

        if (appointmentDto.getNotes() != null) appt.setNotes(appointmentDto.getNotes());

        appt = appointmentRepository.save(appt);

        AppointmentDto dto = new AppointmentDto();
        dto.setId(appt.getId());
        dto.setStatus(normalizeStatus(appt.getStatus()));
        dto.setNotes(appt.getNotes());
        dto.setBuyerName(appt.getBuyer() != null ? appt.getBuyer().getUsername() : null);
        dto.setSellerName(appt.getSeller() != null ? appt.getSeller().getUsername() : null);
        if (appt.getHome() != null) {
            dto.setHomeArea(appt.getHome().getArea());
            dto.setHomeCity(appt.getHome().getCity());
            dto.setHomeLatitude(appt.getHome().getLatitude());
            dto.setHomeLongitude(appt.getHome().getLongitude());
        }
        return dto;
    }

    @Override
    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }

    @Override
    public void deleteAppointment(Long id, String username) {
        in.rebcoder.gs_back.models.Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        in.rebcoder.gs_back.models.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isBuyer = appt.getBuyer() != null && appt.getBuyer().getId().equals(user.getId());
        boolean isSeller = appt.getSeller() != null && appt.getSeller().getId().equals(user.getId());
        if (!isBuyer && !isSeller) {
            throw new UnauthorizedAccessException("You cannot delete this appointment");
        }
        appointmentRepository.delete(appt);
    }

    @Override
    public List<AppointmentDto> getAllAppointments() {
        List<in.rebcoder.gs_back.models.Appointment> appointments = appointmentRepository.findAll();
        return appointments.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public AppointmentDto getAppointmentById(Long id) {
        in.rebcoder.gs_back.models.Appointment appt = appointmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        return toDto(appt);
    }

    @Override
    public List<AppointmentDto> getAppointmentsByUser(Long userId) {
        in.rebcoder.gs_back.models.User user = userRepository.findById(userId).orElse(null);
        if (user == null) return new ArrayList<>();
        List<in.rebcoder.gs_back.models.Appointment> appointments = appointmentRepository.findByBuyer(user);
        List<AppointmentDto> dtos = new ArrayList<>();
        for (in.rebcoder.gs_back.models.Appointment appt : appointments) {
            dtos.add(toDto(appt));
        }
        return dtos;
    }

    @Override
    public List<AppointmentDto> getAppointmentsForBuyer(String username) {
        in.rebcoder.gs_back.models.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return appointmentRepository.findByBuyer(user).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getAppointmentsForSeller(String username) {
        in.rebcoder.gs_back.models.User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return appointmentRepository.findBySeller(seller).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getAppointmentsForSellerSale(String username, Long saleId) {
        in.rebcoder.gs_back.models.User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return appointmentRepository.findBySellerAndSaleId(seller, saleId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getAppointmentsByHome(Long homeId) {
        // Return empty list for now
        return new ArrayList<>();
    }

    @Override
    public boolean isTimeSlotAvailable(Long saleId, LocalDateTime appointmentTime) {
        in.rebcoder.gs_back.models.Sale sale = saleRepository.findById(saleId).orElse(null);
        if (sale == null) return true;
        List<in.rebcoder.gs_back.models.Appointment> existing = appointmentRepository.findBySaleIdAndAppointmentTime(saleId, appointmentTime);
        if (existing == null) existing = List.of();
        int max = sale.getMaxAppointmentsPerSlot() > 0 ? sale.getMaxAppointmentsPerSlot() : 3;
        return existing.size() < max;
    }

    @Override
    public void updateAppointmentStatus(Long id, AppointmentStatus status) {
        in.rebcoder.gs_back.models.Appointment appt = appointmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        appt.setStatus(status);
        appointmentRepository.save(appt);
    }

    private String normalizeStatus(AppointmentStatus status) {
        if (status == null) return null;
        return status.name();
    }

    /**
     * Normalizes a raw client-supplied status string (e.g. the legacy/common
     * misspelling "CANCELED") into a valid {@link AppointmentStatus}.
     */
    private AppointmentStatus normalizeStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) return null;
        String normalized = rawStatus.trim().toUpperCase();
        if ("CANCELED".equals(normalized)) {
            normalized = "CANCELLED";
        }
        return AppointmentStatus.valueOf(normalized);
    }

    private AppointmentDto toDto(in.rebcoder.gs_back.models.Appointment appt) {
        AppointmentDto dto = new AppointmentDto();
        dto.setId(appt.getId());

        // Set entity IDs
        if (appt.getBuyer() != null) {
            dto.setBuyerId(appt.getBuyer().getId());
        }
        if (appt.getSeller() != null) {
            dto.setSellerId(appt.getSeller().getId());
        }
        if (appt.getHome() != null) {
            dto.setHomeId(appt.getHome().getId());
        }
        if (appt.getSale() != null) {
            dto.setSaleId(appt.getSale().getId());
        }

        // Set appointment details
        dto.setAppointmentTime(appt.getAppointmentTime());
        dto.setTimeSlot(appt.getTimeSlot());
        dto.setNotes(appt.getNotes());
        dto.setStatus(normalizeStatus(appt.getStatus()));

        // Set interested item IDs
        if (appt.getInterestedItems() != null && !appt.getInterestedItems().isEmpty()) {
            dto.setInterestedItemIds(appt.getInterestedItems().stream()
                .map(item -> item.getId())
                .collect(Collectors.toList()));
        }

        // Set names and location info
        dto.setBuyerName(appt.getBuyer() != null ? appt.getBuyer().getUsername() : null);
        dto.setSellerName(appt.getSeller() != null ? appt.getSeller().getUsername() : null);

        if (appt.getHome() != null) {
            dto.setHomeArea(appt.getHome().getArea());
            dto.setHomeCity(appt.getHome().getCity());
            dto.setHomeLatitude(appt.getHome().getLatitude());
            dto.setHomeLongitude(appt.getHome().getLongitude());
        }

        return dto;
    }
}
