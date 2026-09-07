package in.rebcoder.gs_back.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegistrationDto {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 100, message = "Username must be between 3 and 100 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 200, message = "Password must be between 8 and 200 characters")
    private String password;

    @Size(max = 80, message = "First name is too long")
    private String firstName;

    @Size(max = 80, message = "Last name is too long")
    private String lastName;

    @Pattern(regexp = "^\\+?[0-9()\\-\\s]{7,20}$", message = "Phone number format is invalid")
    private String phoneNumber;
}
