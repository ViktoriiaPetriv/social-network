package org.proj.userservice.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.proj.userservice.dto.CreateUserRequest;
import org.proj.userservice.dto.UpdateUserDto;
import org.proj.userservice.dto.UserDto;
import org.proj.userservice.exception.UserNotFoundException;
import org.proj.userservice.model.User;
import org.proj.userservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDto findOrCreateUser(CreateUserRequest request) {
        log.info("Finding or creating user with email: {}", request.getEmail());

        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            log.info("User found: id={}", user.getId());

            return UserDto.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .build();
        } else {
            // Створюємо нового користувача
            User newUser = User.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .role(request.getRole())
                    .build();

            User savedUser = userRepository.save(newUser);
            log.info("New user created: id={}", savedUser.getId());

            return UserDto.builder()
                    .id(savedUser.getId())
                    .name(savedUser.getName())
                    .email(savedUser.getEmail())
                    .role(savedUser.getRole())
                    .build();
        }
    }

    public UserDto findUserByEmail(String email) {
        log.info("Finding user by email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .name(user.getName())
                        .role(user.getRole())
                        .build())
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public UserDto updateUserName(Long userId, UpdateUserDto updateDto) {
        log.info("Updating user id={} with new name={}", userId, updateDto.getName());

        // Перевірка унікальності імені
        Optional<User> userWithSameName = userRepository.findByName(updateDto.getName());
        if (userWithSameName.isPresent() && !userWithSameName.get().getId().equals(userId)) {
            throw new IllegalArgumentException("Username already taken: " + updateDto.getName());
        }

        // Отримуємо користувача
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        user.setName(updateDto.getName());
        User updatedUser = userRepository.save(user);

        return UserDto.builder()
                .id(updatedUser.getId())
                .name(updatedUser.getName())
                .email(updatedUser.getEmail())
                .role(updatedUser.getRole())
                .build();
    }


    public List<UserDto> searchUsersByNameContaining(String namePattern) {
        log.info("Searching users by name pattern (containing): {}", namePattern);

        List<User> users = userRepository.findByNameContainingIgnoreCase(namePattern);

        return users.stream()
                .map(user -> UserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .collect(Collectors.toList());
    }
}