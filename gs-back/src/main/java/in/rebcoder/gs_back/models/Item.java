package in.rebcoder.gs_back.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Getter
@Setter
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal price;
    
    @Enumerated(EnumType.STRING)
    private ItemCategory category;
    
    private String condition; // NEW, LIKE_NEW, GOOD, FAIR, POOR
    private String brand;
    private String model;
    
    private boolean isSold;
    private boolean isAvailable = true;
    
    // Images
    @ElementCollection
    private List<String> imageUrls;
    
    @ManyToOne
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale; // The sale this item belongs to
    
    @ManyToOne
    @JoinColumn(name = "home_id", nullable = false)
    private Home home; // The home where this item is located
    
    @ManyToMany(mappedBy = "interestedItems")
    private List<Appointment> appointments; // Appointments interested in this item
}

