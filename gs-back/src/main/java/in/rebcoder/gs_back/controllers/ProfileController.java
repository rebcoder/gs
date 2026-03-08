package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.ProfileDto;
import in.rebcoder.gs_back.services.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileDto> getMyProfile(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(profileService.getUserProfile(username));
    }

    @PutMapping
    public ResponseEntity<ProfileDto> updateMyProfile(@RequestBody ProfileDto dto, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(profileService.updateUserProfile(username, dto));
    }
}