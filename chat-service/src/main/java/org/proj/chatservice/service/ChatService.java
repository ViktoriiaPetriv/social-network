package org.proj.chatservice.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.proj.chatservice.model.Chat;
import org.proj.chatservice.model.ChatParticipant;
import org.proj.chatservice.model.Message;
import org.proj.chatservice.repository.ChatParticipantRepository;
import org.proj.chatservice.repository.ChatRepository;
import org.proj.chatservice.repository.MessageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public Chat createOrGetChat(Long userId1, Long userId2) {
        Optional<Chat> existingChat = chatRepository.findChatByParticipants(userId1, userId2);
        if (existingChat.isPresent()) {
            return existingChat.get();
        }

        Chat chat = new Chat();
        chat.setCreatedAt(LocalDateTime.now());
        Chat savedChat = chatRepository.save(chat);

        participantRepository.save(new ChatParticipant(savedChat, userId1));
        participantRepository.save(new ChatParticipant(savedChat, userId2));

        return savedChat;
    }

    public List<Chat> getChatsByUserId(Long userId) {
        log.info("Fetching chats for userId: {}", userId);
        List<Chat> chats = chatRepository.findByUserId(userId);
        log.info("Found {} chats for userId: {}", chats.size(), userId);
        return chats;
    }

    public List<Message> getMessagesByChatId(Long chatId) {
        return messageRepository.findByChatId(chatId);
    }

    @Transactional
    public Message saveMessage(Message message) {
        return messageRepository.save(message);
    }

    @Transactional
    public Message updateMessage(Long messageId, String newContent, Long currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!message.getSenderId().equals(currentUserId)) {
            throw new SecurityException("You can only edit your own messages");
        }
        message.setContent(newContent);
        message.setUpdatedAt(java.time.LocalDateTime.now().toString());
        return messageRepository.save(message);
    }


}
