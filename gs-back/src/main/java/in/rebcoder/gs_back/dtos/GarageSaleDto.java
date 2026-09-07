package in.rebcoder.gs_back.dtos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class GarageSaleDto {
    private Long id;

    @NotBlank(message = "Sale name is required")
    @Size(max = 140, message = "Sale name must be at most 140 characters")
    private String saleName;

    @Size(max = 1500, message = "Description must be at most 1500 characters")
    private String description;

    @FutureOrPresent(message = "Sale date cannot be in the past")
    private LocalDate saleDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long homeId;
    private Long sellerId;

    @Valid
    private List<ItemDto> items;

    @Size(max = 120, message = "Area must be at most 120 characters")
    private String area;

    @Size(max = 120, message = "City must be at most 120 characters")
    private String city;
    private Double latitude;
    private Double longitude;
    private String status;

    @Min(value = 1, message = "Max appointments per slot must be at least 1")
    @Max(value = 20, message = "Max appointments per slot cannot exceed 20")
    private Integer maxAppointmentsPerSlot;
    private Boolean featured;

    @AssertTrue(message = "Start time must be before end time")
    @JsonIgnore
    public boolean isTimeRangeValid() {
        if (startTime == null || endTime == null) {
            // Absence is handled by defaults/other validation; nothing to compare here.
            return true;
        }
        return startTime.isBefore(endTime);
    }
}
