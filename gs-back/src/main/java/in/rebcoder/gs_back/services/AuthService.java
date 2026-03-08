package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.JwtResponse;
import in.rebcoder.gs_back.dtos.LoginDto;
import in.rebcoder.gs_back.dtos.UserRegistrationDto;

public interface AuthService {
    // TODO: Implement these methods after model updates
    JwtResponse registerUser(UserRegistrationDto userRegistrationDto);
    JwtResponse loginUser(LoginDto loginDto);
}
