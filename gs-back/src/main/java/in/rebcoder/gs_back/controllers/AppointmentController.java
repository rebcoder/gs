package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.services.AppointmentService;
import in.rebcoder.gs_back.repositories.UserRepository;
import in.rebcoder.gs_back.repositories.SaleRepository;
import in.rebcoder.gs_back.repositories.AppointmentRepository;
import in.rebcoder.gs_back.models.Sale;
import in.rebcoder.gs_back.models.AppointmentStatus;
import in.rebcoder.gs_back.models.Appointment;
import in.rebcoder.gs_back.exception.ResourceNotFoundException;
import in.rebcoder.gs_back.exception.UnauthorizedAccessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Validated
public class AppointmentController {

    private static final Logger log = LoggerFactory.getLogger(AppointmentController.class);

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;
    private final SaleRepository saleRepository;
    private final AppointmentRepository appointmentRepository;

    @GetMapping
    public ResponseEntity<List<AppointmentDto>> getAllAppointments(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsForBuyer(authentication.getName()));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<AppointmentDto>> getMyAppointments(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsForBuyer(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDto> getAppointment(@PathVariable Long id, Authentication authentication) {
        verifyAppointmentAccess(id, authentication);
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AppointmentDto>> getUserAppointments(@PathVariable Long userId, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new UnauthorizedAccessException("Authentication required");
        }
        var current = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new UnauthorizedAccessException("User not found"));
        if (!current.getId().equals(userId)) {
            throw new UnauthorizedAccessException("You can only access your own appointments");
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsByUser(userId));
    }

    @PostMapping
    public ResponseEntity<AppointmentDto> createAppointment(@Valid @RequestBody AppointmentDto dto, Authentication authentication) {
        // Derive buyer from authenticated user instead of trusting client-supplied buyerId
        if (authentication != null && authentication.getName() != null) {
            userRepository.findByUsername(authentication.getName()).ifPresent(user -> dto.setBuyerId(user.getId()));
        }
        return ResponseEntity.ok(appointmentService.createAppointment(dto));
    }

    @GetMapping("/seller")
    public ResponseEntity<List<AppointmentDto>> getSellerAppointments(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsForSeller(authentication.getName()));
    }

    @GetMapping("/seller/sales/{saleId}")
    public ResponseEntity<List<AppointmentDto>> getSellerAppointmentsForSale(@PathVariable Long saleId, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsForSellerSale(authentication.getName(), saleId));
    }

    @PostMapping("/seller/appointments/{id}/status")
    public ResponseEntity<AppointmentDto> updateSellerAppointmentStatus(@PathVariable Long id,
                                                                        @RequestParam @NotBlank(message = "status is required") String status,
                                                                        Authentication authentication) {
        // Optionally verify seller owns the appointment
        try {
            in.rebcoder.gs_back.models.Appointment appt = appointmentRepository.findById(id).orElse(null);
            if (appt == null) return ResponseEntity.notFound().build();
            if (authentication != null && authentication.getName() != null) {
                var seller = userRepository.findByUsername(authentication.getName()).orElse(null);
                if (seller != null && appt.getSeller() != null && !appt.getSeller().getId().equals(seller.getId())) {
                    return ResponseEntity.status(403).build();
                }
            }
            AppointmentStatus newStatus = parseStatus(status);
            appointmentService.updateAppointmentStatus(id, newStatus);
            return ResponseEntity.ok(appointmentService.getAppointmentById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/slot-count")
    public ResponseEntity<Map<String, Integer>> getSlotCount(@RequestParam @Positive(message = "saleId must be positive") Long saleId,
                                                             @RequestParam @NotBlank(message = "timeSlot is required") String timeSlot,
                                                             @RequestParam @NotBlank(message = "date is required") String date) {
        // timeSlot expected as HH:mm (e.g., "09:00") or full slot like "09:00-09:30"; parse leading HH:mm
        try {
            Sale sale = saleRepository.findById(saleId).orElse(null);
            if (sale == null) return ResponseEntity.ok(Map.of("count", 0));
            String timePart = timeSlot.split("-")[0];
            LocalDate d = LocalDate.parse(date);
            LocalTime t = LocalTime.parse(timePart);
            LocalDateTime appointmentTime = LocalDateTime.of(d, t);
            int count = appointmentRepository.findBySaleIdAndAppointmentTime(saleId, appointmentTime).size();
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
    }

    @PostMapping("/notify-item-removed")
    public ResponseEntity<Map<String, Object>> notifyItemRemoved(@RequestBody Map<String, Long> payload, Authentication authentication) {
        // Payload expected: { saleId: number, itemId: number }
        Long saleId = payload.get("saleId");
        Long itemId = payload.get("itemId");
        java.util.List<Long> notifiedBuyerIds = new java.util.ArrayList<>();

        if (saleId == null || itemId == null) {
            return ResponseEntity.badRequest().body(Map.of("notifiedCount", 0, "buyers", notifiedBuyerIds));
        }

        if (authentication == null || authentication.getName() == null) {
            throw new UnauthorizedAccessException("Authentication required");
        }
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        var caller = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new UnauthorizedAccessException("User not found"));
        if (sale.getSeller() == null || !sale.getSeller().getId().equals(caller.getId())) {
            throw new UnauthorizedAccessException("Only the sale's owner can notify buyers about a removed item");
        }

        // Find appointments for the sale and notify buyers who had this item in their interestedItems
        java.util.List<in.rebcoder.gs_back.models.Appointment> appts = appointmentRepository.findBySaleId(saleId);
        for (in.rebcoder.gs_back.models.Appointment a : appts) {
            if (a.getInterestedItems() != null) {
                boolean interested = a.getInterestedItems().stream().anyMatch(it -> it.getId() != null && it.getId().equals(itemId));
                if (interested && a.getBuyer() != null) {
                    notifiedBuyerIds.add(a.getBuyer().getId());
                    // In a real system you'd enqueue an email/SMS here. For now just log.
                    log.info("Notifying buyer {} (id={}) about removed item {}", a.getBuyer().getUsername(), a.getBuyer().getId(), itemId);
                }
            }
        }

        return ResponseEntity.ok(Map.of("notifiedCount", notifiedBuyerIds.size(), "buyers", notifiedBuyerIds));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentDto> updateAppointment(@PathVariable Long id, @Valid @RequestBody AppointmentDto dto, Authentication authentication) {
        verifyAppointmentAccess(id, authentication);
        return ResponseEntity.ok(appointmentService.updateAppointment(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new UnauthorizedAccessException("Authentication required");
        }
        appointmentService.deleteAppointment(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * Ensures the authenticated caller is either the buyer or the seller on the
     * given appointment. Throws ResourceNotFoundException (404) for both a
     * missing appointment and an appointment the caller does not own, so callers
     * cannot probe for the existence of appointments that aren't theirs.
     */
    private void verifyAppointmentAccess(Long id, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new UnauthorizedAccessException("Authentication required");
        }
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        var user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new UnauthorizedAccessException("User not found"));
        boolean isBuyer = appt.getBuyer() != null && appt.getBuyer().getId().equals(user.getId());
        boolean isSeller = appt.getSeller() != null && appt.getSeller().getId().equals(user.getId());
        if (!isBuyer && !isSeller) {
            throw new ResourceNotFoundException("Appointment not found");
        }
    }

    private AppointmentStatus parseStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        String normalized = rawStatus.trim().toUpperCase();
        if ("CANCELED".equals(normalized)) {
            return AppointmentStatus.CANCELLED;
        }
        if ("CANCELLED".equals(normalized)) {
            return AppointmentStatus.CANCELLED;
        }
        return AppointmentStatus.valueOf(normalized);
    }
}
