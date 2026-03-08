package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.UserRegistrationDto;
import in.rebcoder.gs_back.exception.ResourceNotFoundException;
import in.rebcoder.gs_back.models.User;
import in.rebcoder.gs_back.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService{

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;  // For password hashing
    @Override
    public User registerNewUser(UserRegistrationDto userRegistrationDto) {
        // TODO: Fix this method after model updates
        User user = new User();
        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }
}
