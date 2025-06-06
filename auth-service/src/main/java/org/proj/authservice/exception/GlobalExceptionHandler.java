package org.proj.authservice.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex) {
    log.error("Authentication error: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("AUTHENTICATION_FAILED", ex.getMessage()));
  }

  @ExceptionHandler(UserServiceException.class)
  public ResponseEntity<ErrorResponse> handleUserServiceException(UserServiceException ex) {
    log.error("User service error: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("USER_SERVICE_ERROR", ex.getMessage()));
  }

  @ExceptionHandler(UserNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleUserNotFoundException(UserNotFoundException ex) {
    log.error("User not found: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("USER_NOT_FOUND", ex.getMessage()));
  }
}
