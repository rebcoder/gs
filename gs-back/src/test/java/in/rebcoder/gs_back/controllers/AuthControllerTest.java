package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.JwtResponse;
import in.rebcoder.gs_back.services.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Test
    void registerReturnsToken() throws Exception {
        when(authService.registerUser(any())).thenReturn(new JwtResponse("token-123"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "user1",
                                  "email": "u1@example.com",
                                  "password": "password123",
                                  "firstName": "U",
                                  "lastName": "One",
                                  "phoneNumber": "1234567890"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-123"));
    }

    @Test
    void loginReturnsToken() throws Exception {
        when(authService.loginUser(any())).thenReturn(new JwtResponse("token-abc"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "username": "u1", "password": "password123" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-abc"));
    }
}

