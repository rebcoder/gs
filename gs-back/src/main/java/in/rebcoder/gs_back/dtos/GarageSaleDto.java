package in.rebcoder.gs_back.dtos;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class GarageSaleDto {
    private Long id;
    private String saleName;
    private String description;
    private LocalDate saleDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long homeId;
    private Long sellerId;
    private List<ItemDto> items;
    private String area;
    private String city;
    private Double latitude;
    private Double longitude;
    private String status;
    private Integer maxAppointmentsPerSlot;
}
