package in.rebcoder.gs_back.dtos;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class ProfileDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String profilePictureUrl;
    private String preferredCity;
    private String preferredArea;
    private Double preferredLatitude;
    private Double preferredLongitude;
    private Integer searchRadiusKm;
    private boolean isActive;
    private boolean isEmailVerified;
    private boolean isPhoneVerified;
    private String bio;
    private Double rating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
}
