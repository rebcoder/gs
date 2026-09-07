package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.exception.UnauthorizedAccessException;
import in.rebcoder.gs_back.models.Appointment;
import in.rebcoder.gs_back.repositories.AppointmentRepository;
import in.rebcoder.gs_back.repositories.UserRepository;
import in.rebcoder.gs_back.services.AppointmentService;
import in.rebcoder.gs_back.services.GarageSaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerController {

    private final AppointmentService appointmentService;
    private final GarageSaleService garageSaleService;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentDto>> getSellerAppointments(Authentication authentication) {
        // NOTE: no @EnableMethodSecurity/@PreAuthorize is wired up in this app and no
        // user carries real authorities, so ownership is enforced explicitly here by
        // filtering to the authenticated caller's own sales (same pattern used by
        // AppointmentController#getSellerAppointments / AppointmentService#getAppointmentsForSeller).
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsForSeller(authentication.getName()));
    }

    @PostMapping("/appointments/{id}/status")
    public ResponseEntity<Void> updateAppointmentStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new UnauthorizedAccessException("Authentication required");
        }
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new in.rebcoder.gs_back.exception.ResourceNotFoundException("Appointment not found"));
        var seller = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new UnauthorizedAccessException("User not found"));
        if (appt.getSeller() == null || !appt.getSeller().getId().equals(seller.getId())) {
            throw new in.rebcoder.gs_back.exception.ResourceNotFoundException("Appointment not found");
        }
        appointmentService.updateAppointmentStatus(id, in.rebcoder.gs_back.models.AppointmentStatus.valueOf(status));
        return ResponseEntity.ok().build();
    }
}
