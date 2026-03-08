package in.rebcoder.gs_back.repositories;

import in.rebcoder.gs_back.models.Home;
import in.rebcoder.gs_back.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HomeRepository extends JpaRepository<Home, Long> {
    Optional<Home> findBySeller(User seller);
}


