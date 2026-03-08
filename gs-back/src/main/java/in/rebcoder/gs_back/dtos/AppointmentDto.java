package in.rebcoder.gs_back.dtos;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AppointmentDto {
    private Long id;
    private Long buyerId;
    private Long sellerId;
    private Long homeId;
    private Long saleId;
    private LocalDateTime appointmentTime;
    private String timeSlot;
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
