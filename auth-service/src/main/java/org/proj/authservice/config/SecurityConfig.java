package org.proj.authservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2Login(oauth -> oauth
                        .defaultSuccessUrl("/auth/login/success", true)
                        .failureUrl("/auth/login/failure"))
                .csrf(AbstractHttpConfigurer::disable)
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(200);
                            response.getWriter().write("Logout successful");
                        })
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID"));
        return http.build();
    }
}