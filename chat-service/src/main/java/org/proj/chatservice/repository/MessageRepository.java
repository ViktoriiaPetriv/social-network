package org.proj.chatservice.repository;

import org.proj.chatservice.model.Chat;
import org.proj.chatservice.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByChatId(Long chatId);

    Message findBySenderIdAndContentAndCreatedAt(Long senderId, String content, String createdAt);

    @Query("SELECT m FROM Message m WHERE m.senderId = :senderId AND m.content = :content AND m.chatId = :chatId AND m.createdAt BETWEEN :startTime AND :endTime ORDER BY m.createdAt DESC")
    List<Message> findBySenderIdAndContentAndChatIdAndCreatedAtBetween(
            @Param("senderId") Long senderId,
            @Param("content") String content,
            @Param("chatId") Long chatId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    // Якщо у вас createdAt зберігається як String, використовуйте цей варіант:
    @Query("SELECT m FROM Message m WHERE m.senderId = :senderId AND m.content = :content AND m.chatId = :chatId")
    List<Message> findBySenderIdAndContentAndChatId(
            @Param("senderId") Long senderId,
            @Param("content") String content,
            @Param("chatId") Long chatId
    );

}
