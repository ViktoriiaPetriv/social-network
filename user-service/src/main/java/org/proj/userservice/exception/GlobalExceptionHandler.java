package org.proj.userservice.exception;

import  lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;


@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(UserNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleUserNotFoundException(UserNotFoundException ex) {
    log.error("User not found: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("USER_NOT_FOUND", ex.getMessage()));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
    log.error("Data integrity violation: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("DUPLICATE_EMAIL", "User with this email already exists"));
  }

//  @ExceptionHandler(MethodArgumentNotValidException.class)
//  public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
//    String message = ex.getBindingResult().getFieldErrors().stream()
//            .map(FieldError::getDefaultMessage)
//            .collect(Collectors.joining(", "));
//
//    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//            .body(new ErrorResponse("VALIDATION_ERROR", message));
//  }
}
