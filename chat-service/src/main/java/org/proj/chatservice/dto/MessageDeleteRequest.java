package org.proj.chatservice.dto;

import lombok.Data;


@Data
public class MessageDeleteRequest {
    private Long senderId;
    private String content;
    private String createdAt;
}
