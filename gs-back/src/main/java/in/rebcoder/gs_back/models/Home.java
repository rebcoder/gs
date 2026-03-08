package in.rebcoder.gs_back.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Home {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String address; // Full address (private, not shown to buyers)
    private String area; // General area/neighborhood (shown to buyers)
    private String city;
    private String state;
    private String postalCode;
    
    // GPS coordinates for map display
    private Double latitude;
    private Double longitude;
    
    @OneToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;  // The seller associated with this home
}

