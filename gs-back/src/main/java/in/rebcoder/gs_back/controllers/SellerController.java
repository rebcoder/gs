package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.services.AppointmentService;
import in.rebcoder.gs_back.services.GarageSaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SellerController {

    private final AppointmentService appointmentService;
    private final GarageSaleService garageSaleService;

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<AppointmentDto>> getSellerAppointments() {
        // In a full implementation we'd get seller id from security context; return all for now
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PostMapping("/appointments/{id}/status")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> updateAppointmentStatus(@PathVariable Long id, @RequestParam String status) {
        appointmentService.updateAppointmentStatus(id, in.rebcoder.gs_back.models.AppointmentStatus.valueOf(status));
        return ResponseEntity.ok().build();
    }
}
