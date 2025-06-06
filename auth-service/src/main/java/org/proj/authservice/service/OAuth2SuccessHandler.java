package org.proj.authservice.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.Map;

@RequiredArgsConstructor
@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    @Value("${user.service.url:http://user-service:8081}")
    private String userServiceUrl;


    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, String> requestBody = Map.of(
                "email", email
        );
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

        String fullUrl = userServiceUrl + "/api/find-or-create";

        ResponseEntity<Map> userResponse = restTemplate.exchange(
                fullUrl,
                HttpMethod.POST,
                entity,
                Map.class
        );

        if (!userResponse.getStatusCode().is2xxSuccessful() || userResponse.getBody() == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "User Service Error");
            return;
        }

        Object idObj = userResponse.getBody().get("id");
        Long userId = idObj instanceof Integer ? ((Integer) idObj).longValue() : (Long) idObj;

        String token = jwtService.generateToken(userId);

        String script = "<script>" +
                "window.opener.postMessage({ token: '" + token + "' }, 'http://localhost:4200');" +
                "window.close();" +
                "</script>";

        response.setContentType("text/html");
        response.getWriter().write(script);
    }
}