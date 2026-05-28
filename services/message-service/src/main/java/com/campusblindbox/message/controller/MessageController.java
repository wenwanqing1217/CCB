package com.campusblindbox.message.controller;

import com.campusblindbox.message.entity.Message;
import com.campusblindbox.message.service.MessageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    /**
     * 获取消息列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMessages(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Message> messages = messageService.getUserMessages(userId, page - 1, size);

            Map<String, Object> data = new HashMap<>();
            data.put("messages", messages.getContent());
            data.put("total", messages.getTotalElements());
            data.put("page", page);
            data.put("size", size);
            data.put("pages", messages.getTotalPages());

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("获取消息列表失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取未读消息
     */
    @GetMapping("/unread")
    public ResponseEntity<Map<String, Object>> getUnreadMessages(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Message> messages = messageService.getUnreadMessages(userId, page - 1, size);
            long unreadCount = messageService.getUnreadCount(userId);

            Map<String, Object> data = new HashMap<>();
            data.put("messages", messages.getContent());
            data.put("unreadCount", unreadCount);
            data.put("total", messages.getTotalElements());

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("获取未读消息失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取未读消息数量
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@RequestParam Long userId) {
        try {
            long count = messageService.getUnreadCount(userId);

            Map<String, Object> data = new HashMap<>();
            data.put("unreadCount", count);

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("获取未读数量失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 标记消息已读
     */
    @PostMapping("/{messageId}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long messageId) {
        try {
            boolean success = messageService.markAsRead(messageId);

            Map<String, Object> data = new HashMap<>();
            data.put("success", success);

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("标记已读失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 标记所有已读
     */
    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@RequestParam Long userId) {
        try {
            messageService.markAllAsRead(userId);

            Map<String, Object> data = new HashMap<>();
            data.put("success", true);

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("标记全部已读失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 发送消息（内部接口）
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestParam Long userId,
            @RequestParam String type,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String relatedId) {
        try {
            Message message = messageService.sendMessage(userId, type, title, content, relatedId);

            Map<String, Object> data = new HashMap<>();
            data.put("message", message);
            data.put("success", true);

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("发送消息失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
