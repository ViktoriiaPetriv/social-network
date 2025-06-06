package org.proj.userservice.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.proj.userservice.model.User;
import org.proj.userservice.repository.UserRepository;
import org.proj.userservice.service.JwtService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.Optional;


@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    public final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
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

                log.debug("JWT token validated for user ID: {}", userId);
                Optional<User> userOptional = userRepository.findById(userId);
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    log.info("User found in database: ID={}, email={}, role={}",
                            user.getId(), user.getEmail(), user.getRole());

                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userId, null, List.of());

                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.debug("Authentication set for user ID: {} with role: {}", userId, user.getRole());
                } else {
                    log.warn("User not found in database for ID: {}", userId);
                    SecurityContextHolder.clearContext();
                }
            } catch (Exception e) {
                // Log invalid token
            }
        }
        filterChain.doFilter(request, response);
    }
}