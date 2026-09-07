package in.rebcoder.gs_back.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ItemDto {
    private Long id;

    @NotBlank(message = "Item name is required")
    @Size(max = 140, message = "Item name must be at most 140 characters")
    private String name;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be non-negative")
    private BigDecimal price;

    @Size(max = 80, message = "Category must be at most 80 characters")
    private String category;
    private String condition;
    private String brand;
    private String model;
    private boolean isSold;
    private boolean isAvailable;
    private String imageUrl;
    private Long saleId;
    private Long homeId;
}
