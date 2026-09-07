package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.repositories.AppointmentRepository;
import in.rebcoder.gs_back.repositories.UserRepository;
import in.rebcoder.gs_back.services.AppointmentService;
import in.rebcoder.gs_back.services.GarageSaleService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SellerController.class)
@AutoConfigureMockMvc(addFilters = false)
class SellerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AppointmentService appointmentService;

    @MockBean
    private GarageSaleService garageSaleService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private AppointmentRepository appointmentRepository;

    @Test
    void getSellerAppointmentsReturnsOnlyAuthenticatedSellersOwnAppointments() throws Exception {
        AppointmentDto ownAppointment = new AppointmentDto();
        ownAppointment.setId(5L);
        ownAppointment.setSellerName("seller1");
        when(appointmentService.getAppointmentsForSeller("seller1")).thenReturn(List.of(ownAppointment));

        mockMvc.perform(get("/api/seller/appointments")
                        .principal(new UsernamePasswordAuthenticationToken("seller1", "pw")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5))
                .andExpect(jsonPath("$[0].sellerName").value("seller1"));

        verify(appointmentService).getAppointmentsForSeller("seller1");
        // Regression guard: must not fall back to returning every appointment in the system.
        verify(appointmentService, never()).getAllAppointments();
    }

    @Test
    void getSellerAppointmentsReturnsEmptyListWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/seller/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(appointmentService, never()).getAllAppointments();
        verify(appointmentService, never()).getAppointmentsForSeller(any());
    }
}
