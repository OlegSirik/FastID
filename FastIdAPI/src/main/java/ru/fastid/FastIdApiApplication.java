package ru.fastid;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FastIdApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(FastIdApiApplication.class, args);
    }
}
