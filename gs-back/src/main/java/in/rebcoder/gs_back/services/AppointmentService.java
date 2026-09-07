package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.models.AppointmentStatus;

import java.util.List;

public interface AppointmentService {
    AppointmentDto createAppointment(AppointmentDto appointmentDto);
    AppointmentDto updateAppointment(Long id, AppointmentDto appointmentDto);
    void deleteAppointment(Long id);
    List<AppointmentDto> getAllAppointments();
    AppointmentDto getAppointmentById(Long id);
    List<AppointmentDto> getAppointmentsByUser(Long userId);
    List<AppointmentDto> getAppointmentsForBuyer(String username);
    List<AppointmentDto> getAppointmentsForSeller(String username);
    List<AppointmentDto> getAppointmentsForSellerSale(String username, Long saleId);
    List<AppointmentDto> getAppointmentsByHome(Long homeId);
    boolean isTimeSlotAvailable(Long saleId, java.time.LocalDateTime appointmentTime);
    void updateAppointmentStatus(Long id, AppointmentStatus status);
    void deleteAppointment(Long id, String username);
}
