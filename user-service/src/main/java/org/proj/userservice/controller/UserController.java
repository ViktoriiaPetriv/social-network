package org.proj.userservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.proj.userservice.dto.CreateUserRequest;
import org.proj.userservice.dto.UpdateUserDto;
import org.proj.userservice.dto.UserDto;
import org.proj.userservice.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok("Hello, " + email + "!");
    }

    @GetMapping("/public/hello")
    public ResponseEntity<String> publicHello() {
        return ResponseEntity.ok("Hello from public endpoint!");
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/find-or-create")
    public ResponseEntity<UserDto> findOrCreateUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("Request to find or create user: {}", request.getEmail());
        UserDto user = userService.findOrCreateUser(request);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/by-email/{email}")
    public ResponseEntity<UserDto> findUserByEmail(@PathVariable String email) {
        log.info("Request to find user by email: {}", email);
        UserDto user = userService.findUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getUserById(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        UserDto user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserDto> updateUserName(@PathVariable Long userId, @RequestBody UpdateUserDto updateDto) {
        UserDto updatedUser = userService.updateUserName(userId, updateDto);
        return ResponseEntity.ok(updatedUser);
    }


    @GetMapping("/users/{userId}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long userId) {
        log.info("Request to get user by ID: {}", userId);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("Current authentication: {}", auth);
        if (auth != null) {
            log.info("Principal: {}, Authorities: {}", auth.getPrincipal(), auth.getAuthorities());
        }

        UserDto user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<UserDto>> searchUsersContaining(
            @RequestParam(name = "pattern") String namePattern) {
        log.info("Searching users by name pattern (containing): {}", namePattern);
        List<UserDto> users = userService.searchUsersByNameContaining(namePattern);
        return ResponseEntity.ok(users);
    }

}