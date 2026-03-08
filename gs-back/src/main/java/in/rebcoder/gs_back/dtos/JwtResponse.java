package in.rebcoder.gs_back.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JwtResponse {
    private String token;
    public JwtResponse(String token) { this.token = token; }
}
