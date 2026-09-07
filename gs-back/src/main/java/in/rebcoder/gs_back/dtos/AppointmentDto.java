package in.rebcoder.gs_back.dtos;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AppointmentDto {
    private Long id;
    private Long buyerId;
    private Long sellerId;
    private Long homeId;

    @NotNull(message = "Sale is required")
    private Long saleId;

    @NotNull(message = "Appointment time is required")
    @Future(message = "Appointment time must be in the future")
    private LocalDateTime appointmentTime;

    @Size(max = 40, message = "Time slot must be at most 40 characters")
    private String timeSlot;

    @Size(max = 500, message = "Notes must be at most 500 characters")
    private String notes;
    private String status;
    private List<Long> interestedItemIds;
    private String buyerName;
    private String sellerName;
    private String homeArea;
    private String homeCity;
    private Double homeLatitude;
    private Double homeLongitude;
}
