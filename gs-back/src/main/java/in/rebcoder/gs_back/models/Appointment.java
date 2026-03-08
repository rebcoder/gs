package in.rebcoder.gs_back.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "appointment")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer; // The user who wants to visit the garage sale

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller; // The seller of the garage sale

    @ManyToOne
    @JoinColumn(name = "home_id", nullable = false)
    private Home home; // The home where the garage sale is

    @ManyToOne
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale; // The specific garage sale

    private LocalDateTime appointmentTime; // Scheduled time for the visit
    
    private String timeSlot; // 30-minute time slot (e.g., "9:00-9:30")
    private String notes; // Any special notes from buyer
    
    @Enumerated(EnumType.STRING)
    private AppointmentStatus status; // PENDING, CONFIRMED, REJECTED, COMPLETED, CANCELLED

    @ManyToMany
    @JoinTable(
            name = "appointment_items",
            joinColumns = @JoinColumn(name = "appointment_id"),
            inverseJoinColumns = @JoinColumn(name = "item_id")
    )
    private List<Item> interestedItems; // Items user is interested in buying
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

