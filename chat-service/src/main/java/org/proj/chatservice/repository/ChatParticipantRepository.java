package org.proj.chatservice.repository;

import org.proj.chatservice.model.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {

    List<ChatParticipant> findByChatId(Long chatId);

    List<ChatParticipant> findByUserId(Long userId);

    boolean existsByChatIdAndUserId(Long chatId, Long userId);

}
