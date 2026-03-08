package in.rebcoder.gs_back.dtos;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ItemDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String condition;
    private String brand;
    private String model;
    private boolean isSold;
    private boolean isAvailable;
    private List<String> imageUrls;
    private Long saleId;
    private Long homeId;
}
