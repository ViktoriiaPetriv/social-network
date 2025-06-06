package org.proj.chatservice.dto;

import lombok.Data;

@Data
public class ChatWithUserResponse {
    private Long id;
    private String otherUserName;
}
