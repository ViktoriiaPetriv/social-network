package org.proj.chatservice.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.proj.chatservice.dto.UserDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

@RequiredArgsConstructor
@Component
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${user.service.url:http://user-service:8081}")
    private String userServiceUrl;


    public UserDto getUser(Long userId) {
        try {
            String jwtToken = getJwtTokenFromRequest();

            if (jwtToken == null) {
                throw new RuntimeException("JWT token not found in request");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + jwtToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String url = "http://user-service:8081/api/users/" + userId;

            ResponseEntity<UserDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    UserDto.class
            );

            return response.getBody();

        } catch (Exception e) {
            log.error("Error calling user service: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch user data", e);
        }
    }

    private String getJwtTokenFromRequest() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes)
                    RequestContextHolder.currentRequestAttributes()).getRequest();

            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        } catch (Exception e) {
            log.warn("Could not get JWT from request: {}", e.getMessage());
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            return (String) details.get("jwt");
        }

        return null;
    }

}
