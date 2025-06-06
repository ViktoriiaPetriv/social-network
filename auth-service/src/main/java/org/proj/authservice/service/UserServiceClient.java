package org.proj.authservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${user.service.url:http://user-service:8081}")
    private String userServiceUrl;

    public UserServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Long findOrCreateUser(String email) {
        String url = userServiceUrl + "/api/find-or-create";

        try {
            log.info("Sending request to user service: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = Map.of("email", email);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object idObj = response.getBody().get("id");
                Long userId = idObj instanceof Integer ? ((Integer) idObj).longValue() : (Long) idObj;

                log.info("Successfully received user ID: {}", userId);
                return userId;
            } else {
                throw new RuntimeException("Invalid response from user service");
            }

        } catch (HttpClientErrorException e) {
            log.error("Error calling user service: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("User service error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error calling user service: {}", e.getMessage());
            throw new RuntimeException("Failed to communicate with user service");
        }
    }
}