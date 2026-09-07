package in.rebcoder.gs_back;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class GsBackApplication {

	public static void main(String[] args) {
		SpringApplication.run(GsBackApplication.class, args);
	}

}
