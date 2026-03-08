package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.services.AppointmentService;
import in.rebcoder.gs_back.repositories.UserRepository;
import in.rebcoder.gs_back.repositories.SaleRepository;
import in.rebcoder.gs_back.repositories.AppointmentRepository;
import in.rebcoder.gs_back.models.Sale;
import in.rebcoder.gs_back.models.AppointmentStatus;
import in.rebcoder.gs_back.models.Appointment;
import in.rebcoder.gs_back.exception.UnauthorizedAccessException;
import org.springframework.security.core.Authentication;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AppointmentController {

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
    public ResponseEntity<AppointmentDto> getAppointment(@PathVariable Long id) {
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
    public ResponseEntity<AppointmentDto> createAppointment(@RequestBody AppointmentDto dto, Authentication authentication) {
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
        var seller = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (seller == null) return ResponseEntity.ok(java.util.Collections.emptyList());
        java.util.List<Appointment> appointments = appointmentRepository.findBySeller(seller);
        java.util.List<AppointmentDto> dtos = new java.util.ArrayList<>();
        for (Appointment a : appointments) {
            dtos.add(appointmentService.getAppointmentById(a.getId()));
        }
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/seller/appointments/{id}/status")
    public ResponseEntity<AppointmentDto> updateSellerAppointmentStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication) {
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
            AppointmentStatus newStatus = AppointmentStatus.valueOf(status);
            appointmentService.updateAppointmentStatus(id, newStatus);
            return ResponseEntity.ok(appointmentService.getAppointmentById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/slot-count")
    public ResponseEntity<Map<String, Integer>> getSlotCount(@RequestParam Long saleId, @RequestParam String timeSlot, @RequestParam String date) {
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
    public ResponseEntity<Map<String, Object>> notifyItemRemoved(@RequestBody Map<String, Long> payload) {
        // Payload expected: { saleId: number, itemId: number }
        Long saleId = payload.get("saleId");
        Long itemId = payload.get("itemId");
        java.util.List<Long> notifiedBuyerIds = new java.util.ArrayList<>();

        if (saleId == null || itemId == null) {
            return ResponseEntity.badRequest().body(Map.of("notifiedCount", 0, "buyers", notifiedBuyerIds));
        }

        // Find appointments for the sale and notify buyers who had this item in their interestedItems
        java.util.List<in.rebcoder.gs_back.models.Appointment> appts = appointmentRepository.findBySaleId(saleId);
        for (in.rebcoder.gs_back.models.Appointment a : appts) {
            if (a.getInterestedItems() != null) {
                boolean interested = a.getInterestedItems().stream().anyMatch(it -> it.getId() != null && it.getId().equals(itemId));
                if (interested && a.getBuyer() != null) {
                    notifiedBuyerIds.add(a.getBuyer().getId());
                    // In a real system you'd enqueue an email/SMS here. For now just log.
                    System.out.println("Notifying buyer " + a.getBuyer().getUsername() + " (id=" + a.getBuyer().getId() + ") about removed item " + itemId);
                }
            }
        }

        return ResponseEntity.ok(Map.of("notifiedCount", notifiedBuyerIds.size(), "buyers", notifiedBuyerIds));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentDto> updateAppointment(@PathVariable Long id, @RequestBody AppointmentDto dto) {
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
}
