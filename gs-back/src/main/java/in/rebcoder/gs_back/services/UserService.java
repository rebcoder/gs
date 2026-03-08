package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.UserRegistrationDto;
import in.rebcoder.gs_back.models.User;

public interface UserService {

    public User registerNewUser(UserRegistrationDto userRegistrationDto);
}
