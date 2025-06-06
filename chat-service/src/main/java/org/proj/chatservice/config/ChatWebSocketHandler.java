package org.proj.chatservice.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.proj.chatservice.model.Message;
import org.proj.chatservice.service.ChatService;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.ConcurrentHashMap;

public class ChatWebSocketHandler extends TextWebSocketHandler {
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ChatService chatService;
    private final ObjectMapper objectMapper;

    public ChatWebSocketHandler(ChatService chatService) {
        this.chatService = chatService;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String chatId = getChatId(session);
        sessions.put(chatId + "_" + session.getId(), session);
        System.out.println("Підключено до чату " + chatId + ", сесія: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String chatId = getChatId(session);
        String payload = message.getPayload();

        try {
            JsonNode jsonNode = objectMapper.readTree(payload);
            String action = jsonNode.has("action") ? jsonNode.get("action").asText() : null;
            String type = jsonNode.has("type") ? jsonNode.get("type").asText() : null;

            if ("delete".equals(action) || "message_delete".equals(type)) {
                Long messageId = jsonNode.has("messageId") ? jsonNode.get("messageId").asLong() : null;
                Long receivedChatId = jsonNode.has("chatId") ? jsonNode.get("chatId").asLong() : null;

                if (messageId == null || receivedChatId == null) {
                    System.err.println("Некоректний delete payload: " + payload);
                    return;
                }

                // Передаємо оригінальний payload для видалення
                for (WebSocketSession s : sessions.values()) {
                    if (s.isOpen() && getChatId(s).equals(chatId) && !s.getId().equals(session.getId())) {
                        s.sendMessage(new TextMessage(payload));
                    }
                }
            } else if ("edit".equals(action) || "message_edit".equals(type)) {
                Long messageId = jsonNode.has("messageId") ? jsonNode.get("messageId").asLong() :
                        jsonNode.has("id") ? jsonNode.get("id").asLong() : null;
                Long receivedChatId = jsonNode.has("chatId") ? jsonNode.get("chatId").asLong() : null;
                String newContent = jsonNode.has("content") ? jsonNode.get("content").asText() : null;
                Long senderId = jsonNode.has("senderId") ? jsonNode.get("senderId").asLong() : null;

                if (messageId == null || receivedChatId == null || newContent == null || senderId == null) {
                    System.err.println("Некоректний edit payload: " + payload);
                    return;
                }

                // Оновлюємо повідомлення в базі даних
                Message updatedMessage = chatService.updateMessage(messageId, newContent, senderId);

                // Створюємо правильну структуру для клієнта
                ObjectNode editResponse = objectMapper.createObjectNode();
                editResponse.put("type", "message_edit");
                editResponse.put("action", "edit");
                editResponse.put("id", messageId);
                editResponse.put("messageId", messageId);
                editResponse.put("chatId", receivedChatId);
                editResponse.put("senderId", senderId);
                editResponse.put("content", newContent);
                editResponse.put("updatedAt", updatedMessage.getUpdatedAt());

                // Додаємо оригінальну дату створення, якщо вона є в запиті
                if (jsonNode.has("createdAt")) {
                    editResponse.put("createdAt", jsonNode.get("createdAt").asText());
                }

                String editResponseJson = objectMapper.writeValueAsString(editResponse);
                System.out.println("Sending edit response: " + editResponseJson);

                // Відправляємо всім учасникам чату, крім відправника
                for (WebSocketSession s : sessions.values()) {
                    if (s.isOpen() && getChatId(s).equals(chatId) && !s.getId().equals(session.getId())) {
                        s.sendMessage(new TextMessage(editResponseJson));
                    }
                }
            } else {
                // Обробка нового повідомлення
                Message incomingMessage = objectMapper.readValue(payload, Message.class);
                incomingMessage.setChatId(Long.parseLong(chatId));
                incomingMessage.setCreatedAt(java.time.LocalDateTime.now().toString());

                Message savedMessage = chatService.saveMessage(incomingMessage);

                String savedMessageJson = objectMapper.writeValueAsString(savedMessage);

                // Відправляємо всім учасникам чату
                for (WebSocketSession s : sessions.values()) {
                    if (s.isOpen() && getChatId(s).equals(chatId)) {
                        s.sendMessage(new TextMessage(savedMessageJson));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Помилка обробки WebSocket повідомлення: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String chatId = getChatId(session);
        sessions.remove(chatId + "_" + session.getId());
        System.out.println("Відключено від чату " + chatId + ", сесія: " + session.getId() + ", статус: " + status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("WebSocket transport error: " + exception.getMessage());
        exception.printStackTrace();
    }

    private String getChatId(WebSocketSession session) {
        String uri = session.getUri().toString();
        return uri.substring(uri.lastIndexOf('/') + 1);
    }
}