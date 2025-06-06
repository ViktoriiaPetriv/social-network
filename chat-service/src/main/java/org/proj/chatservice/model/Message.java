package org.proj.chatservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity
@Data
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long chatId;
    private Long senderId;

    @Column(columnDefinition = "TEXT")
    @Size(max = 1000, message = "Message content cannot exceed 1000 characters")
    private String content;

    private String createdAt;
    private String updatedAt;
}