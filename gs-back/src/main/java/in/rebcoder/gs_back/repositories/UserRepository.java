package in.rebcoder.gs_back.repositories;

import in.rebcoder.gs_back.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {

    User findByEmail(String email);
    java.util.Optional<User> findByUsername(String username);
}
