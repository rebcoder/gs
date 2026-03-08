package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.models.*;
import in.rebcoder.gs_back.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HomeRepository homeRepository;

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testCreateAppointment() {
        User buyer = new User(); buyer.setId(1L); buyer.setUsername("buyer");
        User seller = new User(); seller.setId(2L); seller.setUsername("seller");
        Home home = new Home(); home.setId(3L);
        Sale sale = new Sale(); sale.setId(4L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(seller));
        when(homeRepository.findById(3L)).thenReturn(Optional.of(home));
        when(saleRepository.findById(4L)).thenReturn(Optional.of(sale));

        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(99L);
            return a;
        });

        AppointmentDto dto = new AppointmentDto();
        dto.setBuyerId(1L);
        dto.setSellerId(2L);
        dto.setHomeId(3L);
        dto.setSaleId(4L);
        dto.setAppointmentTime(LocalDateTime.now().plusDays(1));

        AppointmentDto created = appointmentService.createAppointment(dto);

        assertNotNull(created);
        assertEquals(99L, created.getId());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    public void testUpdateAppointmentStatus() {
        Appointment existing = new Appointment();
        existing.setId(50L);
        existing.setStatus(AppointmentStatus.PENDING);

        when(appointmentRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        appointmentService.updateAppointmentStatus(50L, AppointmentStatus.CONFIRMED);

        assertEquals(AppointmentStatus.CONFIRMED, existing.getStatus());
        verify(appointmentRepository, times(1)).save(existing);
    }

    @Test
    public void testGetAllAppointments() {
        when(appointmentRepository.findAll()).thenReturn(java.util.Collections.emptyList());
        var list = appointmentService.getAllAppointments();
        assertNotNull(list);
        assertTrue(list.isEmpty());
        verify(appointmentRepository, times(1)).findAll();
    }
}

