package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.models.Appointment;
import in.rebcoder.gs_back.models.Sale;
import in.rebcoder.gs_back.models.User;
import in.rebcoder.gs_back.repositories.AppointmentRepository;
import in.rebcoder.gs_back.repositories.SaleRepository;
import in.rebcoder.gs_back.repositories.UserRepository;
import in.rebcoder.gs_back.services.AppointmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AppointmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AppointmentService appointmentService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private SaleRepository saleRepository;

    @MockBean
    private AppointmentRepository appointmentRepository;

    @Test
    void slotCountReturnsCountField() throws Exception {
        Sale sale = new Sale();
        sale.setId(10L);
        when(saleRepository.findById(10L)).thenReturn(java.util.Optional.of(sale));
        when(appointmentRepository.findBySaleIdAndAppointmentTime(eq(10L), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/appointments/slot-count")
                        .param("saleId", "10")
                        .param("timeSlot", "09:00")
                        .param("date", "2026-01-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    void notifyItemRemovedRequiresSaleIdAndItemId() throws Exception {
        mockMvc.perform(post("/api/appointments/notify-item-removed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "saleId": 1 }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.notifiedCount").value(0));
    }

    @Test
    void createAppointmentDelegatesToService() throws Exception {
        AppointmentDto created = new AppointmentDto();
        created.setId(99L);
        when(appointmentService.createAppointment(any())).thenReturn(created);

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "saleId": 1, "appointmentTime": "2099-01-01T09:00:00" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(99));
    }

    private Appointment appointmentWithBuyerAndSeller() {
        User buyer = new User();
        buyer.setId(1L);
        buyer.setUsername("buyer1");
        User seller = new User();
        seller.setId(2L);
        seller.setUsername("seller1");

        Appointment appt = new Appointment();
        appt.setId(10L);
        appt.setBuyer(buyer);
        appt.setSeller(seller);
        return appt;
    }

    @Test
    void getAppointmentRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/appointments/10"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAppointmentRejectsNonOwner() throws Exception {
        Appointment appt = appointmentWithBuyerAndSeller();
        User stranger = new User();
        stranger.setId(3L);
        stranger.setUsername("stranger");

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appt));
        when(userRepository.findByUsername("stranger")).thenReturn(Optional.of(stranger));

        mockMvc.perform(get("/api/appointments/10")
                        .principal(new UsernamePasswordAuthenticationToken("stranger", "pw")))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAppointmentAllowsBuyer() throws Exception {
        Appointment appt = appointmentWithBuyerAndSeller();
        AppointmentDto dto = new AppointmentDto();
        dto.setId(10L);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appt));
        when(userRepository.findByUsername("buyer1")).thenReturn(Optional.of(appt.getBuyer()));
        when(appointmentService.getAppointmentById(10L)).thenReturn(dto);

        mockMvc.perform(get("/api/appointments/10")
                        .principal(new UsernamePasswordAuthenticationToken("buyer1", "pw")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void getAppointmentAllowsSeller() throws Exception {
        Appointment appt = appointmentWithBuyerAndSeller();
        AppointmentDto dto = new AppointmentDto();
        dto.setId(10L);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appt));
        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(appt.getSeller()));
        when(appointmentService.getAppointmentById(10L)).thenReturn(dto);

        mockMvc.perform(get("/api/appointments/10")
                        .principal(new UsernamePasswordAuthenticationToken("seller1", "pw")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void updateAppointmentRejectsNonOwner() throws Exception {
        Appointment appt = appointmentWithBuyerAndSeller();
        User stranger = new User();
        stranger.setId(3L);
        stranger.setUsername("stranger");

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appt));
        when(userRepository.findByUsername("stranger")).thenReturn(Optional.of(stranger));

        mockMvc.perform(put("/api/appointments/10")
                        .principal(new UsernamePasswordAuthenticationToken("stranger", "pw"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "saleId": 1, "appointmentTime": "2099-01-01T09:00:00", "status": "CONFIRMED" }
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateAppointmentAllowsOwner() throws Exception {
        Appointment appt = appointmentWithBuyerAndSeller();
        AppointmentDto updated = new AppointmentDto();
        updated.setId(10L);
        updated.setStatus("CONFIRMED");

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appt));
        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(appt.getSeller()));
        when(appointmentService.updateAppointment(eq(10L), any())).thenReturn(updated);

        mockMvc.perform(put("/api/appointments/10")
                        .principal(new UsernamePasswordAuthenticationToken("seller1", "pw"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "saleId": 1, "appointmentTime": "2099-01-01T09:00:00", "status": "CONFIRMED" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }
}

