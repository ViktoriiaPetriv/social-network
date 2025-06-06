package org.proj.authservice.exception;

public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
