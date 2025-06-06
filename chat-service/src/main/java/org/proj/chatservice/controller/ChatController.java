package org.proj.chatservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.proj.chatservice.dto.*;
import org.proj.chatservice.model.Chat;
import org.proj.chatservice.model.Message;
import org.proj.chatservice.model.ChatParticipant;
import org.proj.chatservice.repository.MessageRepository;
import org.proj.chatservice.service.ChatService;
import org.proj.chatservice.service.UserServiceClient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class ChatController {

    private final UserServiceClient userServiceClient;
    private final ChatService chatService;
    private final MessageRepository messageRepository;

    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        String id = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDto userDto = userServiceClient.getUser(Long.parseLong(id));
        return ResponseEntity.ok("Hello, " + userDto.getName() + "!");
    }

    @GetMapping("/public/hello")
    public ResponseEntity<String> publicHello() {
        return ResponseEntity.ok("Hello from public endpoint!");
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> createOrGetChat(@RequestBody CreateChatRequest request) {
        Chat chat = chatService.createOrGetChat(request.getFirstUserId(), request.getSecondUserId());
        return ResponseEntity.ok(new ChatResponse(chat.getId()));
    }

    @GetMapping("/chats/{chatId}/messages")
    public List<Message> getMessages(@PathVariable Long chatId) {
        return chatService.getMessagesByChatId(chatId);
    }

    @PostMapping("/chats/{chatId}/messages")
    public ResponseEntity<Message> saveMessage(@PathVariable Long chatId, @RequestBody Message message) {
        message.setChatId(chatId);
        message.setCreatedAt(LocalDateTime.now().toString());
        Message savedMessage = chatService.saveMessage(message);
        return ResponseEntity.ok(savedMessage);
    }

    @GetMapping("/chats")
    public List<ChatWithUserResponse> getUserChats() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("Authentication: {}, Principal: {}, Type: {}",
                auth, auth != null ? auth.getPrincipal() : "null",
                auth != null && auth.getPrincipal() != null ? auth.getPrincipal().getClass() : "null");
        Long currentUserId = (Long) auth.getPrincipal();
        List<Chat> chats = chatService.getChatsByUserId(currentUserId);
        return chats.stream()
                .map(chat -> {
                    Long otherUserId = chat.getParticipants().stream()
                            .filter(p -> !p.getUserId().equals(currentUserId))
                            .findFirst()
                            .map(ChatParticipant::getUserId)
                            .orElseThrow(() -> new IllegalStateException("No other participant found"));
                    UserDto userDto = userServiceClient.getUser(otherUserId);
                    ChatWithUserResponse response = new ChatWithUserResponse();
                    response.setId(chat.getId());
                    response.setOtherUserName(userDto.getName());
                    return response;
                })
                .collect(Collectors.toList());
    }

    @DeleteMapping("/chats/{chatId}/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long chatId, @PathVariable Long messageId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = (Long) auth.getPrincipal();

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getSenderId().equals(currentUserId)) {
            throw new SecurityException("You can only delete your own messages");
        }
        if (!message.getChatId().equals(chatId)) {
            throw new IllegalArgumentException("Message does not belong to this chat");
        }

        messageRepository.deleteById(messageId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/chats/{chatId}/messages")
    public ResponseEntity<?> deleteMessage(@PathVariable Long chatId, @RequestBody MessageDeleteRequest messageDeleteRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = (Long) auth.getPrincipal();

        try {
            LocalDateTime requestTime = LocalDateTime.parse(messageDeleteRequest.getCreatedAt());

            List<Message> messages = messageRepository.findBySenderIdAndContentAndChatIdAndCreatedAtBetween(
                    messageDeleteRequest.getSenderId(),
                    messageDeleteRequest.getContent(),
                    chatId,
                    requestTime.minusMinutes(1),
                    requestTime.plusMinutes(1)
            );

            if (messages.isEmpty()) {
                throw new IllegalArgumentException("Message not found");
            }

            // Find the message closest to the requested time
            Message message = messages.stream()
                    .min((m1, m2) -> {
                        LocalDateTime time1 = LocalDateTime.parse(m1.getCreatedAt());
                        LocalDateTime time2 = LocalDateTime.parse(m2.getCreatedAt());
                        long diff1 = Math.abs(Duration.between(requestTime, time1).getSeconds());
                        long diff2 = Math.abs(Duration.between(requestTime, time2).getSeconds());
                        return Long.compare(diff1, diff2);
                    })
                    .orElseThrow(() -> new IllegalArgumentException("Message not found"));

            // Check permissions
            if (!message.getSenderId().equals(currentUserId)) {
                throw new SecurityException("You can only delete your own messages");
            }
            if (!message.getChatId().equals(chatId)) {
                throw new IllegalArgumentException("Message does not belong to this chat");
            }

            messageRepository.deleteById(message.getId());
            return ResponseEntity.ok().build();

        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date format: " + messageDeleteRequest.getCreatedAt());
        }
    }

    @PutMapping("/chats/{chatId}/messages/{messageId}")
    public ResponseEntity<Message> updateMessage(
            @PathVariable Long chatId,
            @PathVariable Long messageId,
            @RequestBody Message updateRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = (Long) auth.getPrincipal();
        Message updatedMessage = chatService.updateMessage(messageId, updateRequest.getContent(), currentUserId);
        if (!updatedMessage.getChatId().equals(chatId)) {
            throw new IllegalArgumentException("Message does not belong to this chat");
        }
        return ResponseEntity.ok(updatedMessage);
    }

}

