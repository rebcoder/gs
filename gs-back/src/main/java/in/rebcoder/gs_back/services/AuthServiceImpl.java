package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.JwtResponse;
import in.rebcoder.gs_back.dtos.LoginDto;
import in.rebcoder.gs_back.dtos.UserRegistrationDto;
import in.rebcoder.gs_back.models.User;
import in.rebcoder.gs_back.repositories.UserRepository;
import in.rebcoder.gs_back.utils.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService, UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public JwtResponse registerUser(UserRegistrationDto userRegistrationDto) {
        // Check if user already exists
        if (userRepository.findByUsername(userRegistrationDto.getUsername()).isPresent() ||
            userRepository.findByEmail(userRegistrationDto.getEmail()) != null) {
            throw new RuntimeException("User already exists");
        }

        // Create new user
        User user = new User();
        user.setEmail(userRegistrationDto.getEmail());
        user.setUsername(userRegistrationDto.getUsername());
        user.setPassword(passwordEncoder.encode(userRegistrationDto.getPassword()));
        user.setFirstName(userRegistrationDto.getFirstName());
        user.setLastName(userRegistrationDto.getLastName());
        user.setPhoneNumber(userRegistrationDto.getPhoneNumber());

        userRepository.save(user);

        // Generate JWT token without roles
        String token = jwtTokenProvider.generateToken(user.getUsername());
        return new JwtResponse(token);
    }

    @Override
    public JwtResponse loginUser(LoginDto loginDto) {
        // Authenticate user by verifying password directly to avoid circular bean dependency
        User user = userRepository.findByUsername(loginDto.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            // Generate JWT token without roles
            String token = jwtTokenProvider.generateToken(user.getUsername());
            return new JwtResponse(token);
        }

        throw new RuntimeException("Invalid credentials");
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Return user without roles for role-free authentication
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                true, true, true, true,
                new ArrayList<>() // Empty authorities list for role-free system
        );
    }


}


