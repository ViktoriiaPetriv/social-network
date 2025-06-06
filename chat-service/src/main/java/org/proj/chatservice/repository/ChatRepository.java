package org.proj.chatservice.repository;

import org.proj.chatservice.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Query("""
        SELECT c FROM Chat c
        JOIN ChatParticipant p1 ON c.id = p1.chat.id AND p1.userId = :userId1
        JOIN ChatParticipant p2 ON c.id = p2.chat.id AND p2.userId = :userId2
        """)
    Optional<Chat> findChatByParticipants(@Param("userId1") Long userId1, @Param("userId2") Long userId2);


    @Query("""
        SELECT c FROM Chat c
        JOIN ChatParticipant p ON c.id = p.chat.id AND p.userId = :userId
        """)
    List<Chat> findByUserId(@Param("userId") Long userId);

}
