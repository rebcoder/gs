package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.ProfileDto;
import in.rebcoder.gs_back.models.Profile;
import in.rebcoder.gs_back.models.User;
import in.rebcoder.gs_back.repositories.ProfileRepository;
import in.rebcoder.gs_back.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService{
    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public Profile createProfile(Profile profile) {
        return profileRepository.save(profile);
    }

    public Profile getProfileByUser(User user) {
        return profileRepository.findByUser(user);
    }

    public Profile updateProfile(Long id, Profile updatedProfile) {
        Profile existing = profileRepository.findById(id).orElseThrow();
        existing.setBio(updatedProfile.getBio());
        existing.setRating(updatedProfile.getRating());
        return profileRepository.save(existing);
    }

    @Override
    public ProfileDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        Profile profile = profileRepository.findByUser(user);
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
            profile.setBio("");
            profile.setRating(0);
            profile = profileRepository.save(profile);
        }
        ProfileDto dto = new ProfileDto();
        dto.setId(profile.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setBio(profile.getBio());
        dto.setRating(profile.getRating());
        dto.setCreatedAt((LocalDateTime) null);
        dto.setUpdatedAt((LocalDateTime) null);
        return dto;
    }

    @Override
    public ProfileDto updateUserProfile(String username, ProfileDto profileDto) {
        User user = userRepository.findByUsername(username).orElseThrow();
        // update basic user fields
        if (profileDto.getFirstName() != null) user.setFirstName(profileDto.getFirstName());
        if (profileDto.getLastName() != null) user.setLastName(profileDto.getLastName());
        if (profileDto.getPhoneNumber() != null) user.setPhoneNumber(profileDto.getPhoneNumber());
        userRepository.save(user);

        // update profile fields
        Profile profile = profileRepository.findByUser(user);
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
        }
        if (profileDto.getBio() != null) profile.setBio(profileDto.getBio());
        if (profileDto.getRating() != null) profile.setRating(profileDto.getRating());
        profile = profileRepository.save(profile);

        return getUserProfile(username);
    }
}
