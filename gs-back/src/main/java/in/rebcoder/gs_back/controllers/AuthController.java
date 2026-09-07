package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.LoginDto;
import in.rebcoder.gs_back.dtos.UserRegistrationDto;
import jakarta.validation.Valid;
import in.rebcoder.gs_back.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationDto userRegistrationDto) {
        return ResponseEntity.ok(authService.registerUser(userRegistrationDto));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto loginDto) {
        return ResponseEntity.ok(authService.loginUser(loginDto));
    }
}
