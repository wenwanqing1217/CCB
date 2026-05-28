package com.campusblindbox.order.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "box_id", length = 50, nullable = false)
    private String boxId;

    @Column(name = "buyer_id", length = 50, nullable = false)
    private String buyerId;

    @Column(name = "seller_id", length = 50, nullable = false)
    private String sellerId;

    @Column(name = "rider_id", length = 50)
    private String riderId;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "delivery_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "status", length = 20, nullable = false)
    private String status; // pending, grabbed, delivering, completed, cancelled

    @Column(name = "from_dorm", length = 50)
    private String fromDorm;

    @Column(name = "to_dorm", length = 50)
    private String toDorm;

    @Column(name = "create_time", nullable = false)
    private Date createTime;

    @Column(name = "update_time")
    private Date updateTime;
}
