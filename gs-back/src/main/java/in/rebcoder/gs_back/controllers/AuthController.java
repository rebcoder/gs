package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.LoginDto;
import in.rebcoder.gs_back.dtos.UserRegistrationDto;
import in.rebcoder.gs_back.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegistrationDto userRegistrationDto) {
        return ResponseEntity.ok(authService.registerUser(userRegistrationDto));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto loginDto) {
        return ResponseEntity.ok(authService.loginUser(loginDto));
    }
}
