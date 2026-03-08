package in.rebcoder.gs_back.repositories;

import in.rebcoder.gs_back.models.Sale;
import in.rebcoder.gs_back.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
     List<Sale> findBySeller(User seller);
}
