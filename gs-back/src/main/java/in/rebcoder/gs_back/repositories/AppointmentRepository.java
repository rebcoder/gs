package in.rebcoder.gs_back.repositories;

import in.rebcoder.gs_back.models.Appointment;
import in.rebcoder.gs_back.models.Home;
import in.rebcoder.gs_back.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByBuyer(User buyer);
    List<Appointment> findByHome(Home home);

    List<Appointment> findByHomeAndAppointmentTime(Home home, LocalDateTime appointmentTime);

    List<Appointment> findBySeller(User seller);
    List<Appointment> findBySellerAndSaleId(User seller, Long saleId);

    List<Appointment> findBySaleId(Long saleId);

    List<Appointment> findBySaleIdAndAppointmentTime(Long saleId, LocalDateTime appointmentTime);
}
