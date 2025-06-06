package org.proj.chatservice.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.proj.chatservice.service.JwtService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;


import java.io.IOException;
import java.util.List;

@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtService.validateToken(token);
                Long userId = Long.parseLong(claims.getSubject());
                log.info("JWT validated successfully for user ID: {}", userId);

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        userId, null, List.of());

                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (Exception e) {
                // Log invalid token
            }
        }
        filterChain.doFilter(request, response);
    }
}