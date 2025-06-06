package org.proj.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserDto {

    @NotBlank(message = "Name is required")
    private String name;

}
