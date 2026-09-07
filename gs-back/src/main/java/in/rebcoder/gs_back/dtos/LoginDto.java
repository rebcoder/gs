package in.rebcoder.gs_back.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginDto {
    @NotBlank(message = "Username is required")
    @Size(max = 100, message = "Username is too long")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 200, message = "Password must be between 6 and 200 characters")
    private String password;
}
