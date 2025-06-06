package org.proj.authservice.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class OAuthUserFetcher {

    private final RestTemplate restTemplate = new RestTemplate();

    public String fetchOrCreateUserId(String email, String name, String picture) {
        String url = "http://localhost:8081/api/find-or-create";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = Map.of(
                "email", email,
                "name", name,
                "picture", picture
        );

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return (String) response.getBody().get("userId");
        } else {
            throw new RuntimeException("Failed to fetch/create user from user-service");
        }
    }
}

