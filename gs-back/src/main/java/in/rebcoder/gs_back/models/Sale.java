package in.rebcoder.gs_back.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Entity
@Getter
@Setter
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL)
    private List<Item> items;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;
    
    @ManyToOne
    @JoinColumn(name = "home_id", nullable = false)
    private Home home;
    
    @NotBlank(message = "Sale name is required")
    private String saleName;
    
    @FutureOrPresent(message = "Sale date cannot be in the past")
    private LocalDate saleDate;
    
    private LocalTime startTime; // Start time of garage sale
    private LocalTime endTime;   // End time of garage sale
    
    private String description;
    
    @Enumerated(EnumType.STRING)
    private SaleStatus status; // ACTIVE, COMPLETED, CANCELLED
    
    private int maxAppointmentsPerSlot = 3; // Maximum 3 people per time slot
    
    // Sale location details (derived from home)
    private String area;
    private String city;
    private Double latitude;
    private Double longitude;

    // Promoted sale shown on homepage featured section
    private boolean featured = false;
}
