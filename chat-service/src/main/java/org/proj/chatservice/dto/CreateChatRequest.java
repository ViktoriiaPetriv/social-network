package org.proj.chatservice.dto;

import lombok.Data;

@Data
public class CreateChatRequest {
    private Long firstUserId;
    private Long secondUserId;
}
