package org.proj.chatservice.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@Entity
public class ChatParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Chat chat;

    private Long userId;

    public ChatParticipant() {
    }

    public ChatParticipant(Chat chat, Long userId) {
        this.chat = chat;
        this.userId = userId;
    }
}
