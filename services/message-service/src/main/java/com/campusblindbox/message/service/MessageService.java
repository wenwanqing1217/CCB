package com.campusblindbox.message.service;

import com.campusblindbox.message.entity.Message;
import com.campusblindbox.message.repository.MessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    /**
     * 发送消息
     */
    @Transactional
    public Message sendMessage(Long userId, String type, String title, String content, String relatedId) {
        Message message = new Message();
        message.setUserId(userId);
        message.setType(type);
        message.setTitle(title);
        message.setContent(content);
        message.setRelatedId(relatedId);
        message.setStatus("UNREAD");

        message = messageRepository.save(message);
        log.info("发送消息: userId={}, type={}, title={}", userId, type, title);

        // TODO: 实际对接微信订阅消息
        // sendSubscribeMessage(userId, type, title, content);

        return message;
    }

    /**
     * 发送订单相关消息
     */
    public void sendOrderMessage(Long userId, String orderId, String status) {
        String title;
        String content;

        switch (status) {
            case "CREATED":
                title = "订单已创建";
                content = "您的订单已创建成功，等待骑手接单";
                break;
            case "GRABBED":
                title = "骑手已接单";
                content = "骑手已接单，正在前往取货";
                break;
            case "DELIVERING":
                title = "配送中";
                content = "骑手正在配送中，请注意查收";
                break;
            case "COMPLETED":
                title = "订单已完成";
                content = "感谢您的使用，欢迎再次下单";
                break;
            case "CANCELLED":
                title = "订单已取消";
                content = "您的订单已取消";
                break;
            default:
                title = "订单状态更新";
                content = "您的订单状态已更新";
        }

        sendMessage(userId, "ORDER", title, content, orderId);
    }

    /**
     * 发送系统消息
     */
    public void sendSystemMessage(Long userId, String title, String content) {
        sendMessage(userId, "SYSTEM", title, content, null);
    }

    /**
     * 查询用户消息列表
     */
    public Page<Message> getUserMessages(Long userId, int page, int size) {
        return messageRepository.findByUserIdOrderByCreateTimeDesc(
                userId,
                PageRequest.of(page, size)
        );
    }

    /**
     * 查询未读消息
     */
    public Page<Message> getUnreadMessages(Long userId, int page, int size) {
        return messageRepository.findByUserIdAndStatusOrderByCreateTimeDesc(
                userId,
                "UNREAD",
                PageRequest.of(page, size)
        );
    }

    /**
     * 获取未读消息数量
     */
    public long getUnreadCount(Long userId) {
        return messageRepository.countByUserIdAndStatus(userId, "UNREAD");
    }

    /**
     * 标记消息为已读
     */
    @Transactional
    public boolean markAsRead(Long messageId) {
        return messageRepository.findById(messageId).map(message -> {
            message.setStatus("READ");
            message.setReadTime(new java.util.Date());
            messageRepository.save(message);
            log.info("标记消息已读: messageId={}", messageId);
            return true;
        }).orElse(false);
    }

    /**
     * 标记所有消息为已读
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        Page<Message> unreadMessages = getUnreadMessages(userId, 0, 1000);
        unreadMessages.getContent().forEach(message -> {
            message.setStatus("READ");
            message.setReadTime(new java.util.Date());
            messageRepository.save(message);
        });
        log.info("标记所有消息已读: userId={}", userId);
    }

    /**
     * TODO: 对接微信订阅消息
     */
    private void sendSubscribeMessage(Long userId, String type, String title, String content) {
        // 实际项目中，应该调用微信订阅消息API
        // 这里仅作占位
        log.info("发送微信订阅消息: userId={}, title={}", userId, title);
    }
}
