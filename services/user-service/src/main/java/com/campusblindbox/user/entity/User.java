package com.campusblindbox.user.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String openid;  // 微信OpenID

    @Column(length = 64)
    private String nickname;  // 昵称

    @Column(length = 255)
    private String avatar;  // 头像URL

    @Column(length = 20)
    private String phone;  // 手机号

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.BUYER;  // 角色

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;  // 状态

    @Column(length = 64)
    private String campus;  // 校区

    @Column(length = 64)
    private String dormitory;  // 宿舍楼

    @CreationTimestamp
    @Column(updatable = false)
    private Date createTime;

    @UpdateTimestamp
    private Date updateTime;

    // 角色枚举
    public enum Role {
        BUYER,        // 买家
        SELLER,       // 个人卖家
        MERCHANT,     // 认证商家
        RIDER,        // 骑手
        ADMIN         // 管理员
    }

    // 状态枚举
    public enum Status {
        ACTIVE,   // 正常
        BANNED,   // 被禁用
        PENDING   // 待审核（商家/骑手申请中）
    }
}
