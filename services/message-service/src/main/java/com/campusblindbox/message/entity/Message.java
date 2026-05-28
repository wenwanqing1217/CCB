package com.campusblindbox.message.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;  // 接收用户ID

    @Column(nullable = false, length = 20)
    private String type;  // 消息类型: ORDER/SYSTEM/DELIVERY/PROMO

    @Column(nullable = false, length = 255)
    private String title;  // 消息标题

    @Column(length = 1000)
    private String content;  // 消息内容

    @Column(length = 64)
    private String relatedId;  // 关联ID（如订单ID）

    @Column(nullable = false, length = 20)
    private String status = "UNREAD";  // 状态: UNREAD/READ

    @CreationTimestamp
    @Column(updatable = false)
    private Date createTime;

    private Date readTime;  // 阅读时间
}
