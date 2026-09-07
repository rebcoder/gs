package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.GarageSaleDto;
import in.rebcoder.gs_back.services.GarageSaleService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = GarageSaleController.class)
@AutoConfigureMockMvc(addFilters = false)
class GarageSaleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GarageSaleService garageSaleService;

    @Test
    void listSalesReturnsArray() throws Exception {
        var dto = new GarageSaleDto();
        dto.setId(1L);
        dto.setSaleName("Sale");
        when(garageSaleService.searchGarageSales(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/garage-sales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].saleName").value("Sale"));
    }

    @Test
    void searchValidatesMaxLength() throws Exception {
        String longQuery = "x".repeat(121);
        mockMvc.perform(get("/api/garage-sales/search").param("q", longQuery))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nearbyRequiresLatLng() throws Exception {
        mockMvc.perform(get("/api/garage-sales/nearby"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createSaleDelegatesToService() throws Exception {
        var created = new GarageSaleDto();
        created.setId(5L);
        created.setSaleName("Created");
        when(garageSaleService.createGarageSale(any())).thenReturn(created);

        mockMvc.perform(post("/api/garage-sales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "saleName": "Created", "description": "d" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.saleName").value("Created"));
    }
}

