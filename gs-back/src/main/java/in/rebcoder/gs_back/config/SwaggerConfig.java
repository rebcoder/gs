package in.rebcoder.gs_back.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Garage Sale API")
                        .version("1.0")
                        .description("API documentation for Garage Sale application")
                        .contact(new Contact()
                                .name("Your Name")
                                .email("your.email@example.com")));
    }

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public")
                .pathsToMatch("/api/**") // Adjust according to your endpoints
                .build();
    }
}
//Access Swagger UI: Run your application and navigate to http://localhost:8080/swagger-ui/index.html to view the API documentation.
