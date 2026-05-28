package com.campusblindbox.box.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Data
@Entity
@Table(name = "boxes")
public class Box {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "seller_id", length = 50, nullable = false)
    private String sellerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "category", length = 50)
    private String category;

    @ElementCollection
    @CollectionTable(name = "box_tags", joinColumns = @JoinColumn(name = "box_id"))
    @Column(name = "tag")
    private List<String> tags;

    @ElementCollection
    @CollectionTable(name = "box_images", joinColumns = @JoinColumn(name = "box_id"))
    @Column(name = "image_url")
    private List<String> images;

    @Column(name = "from_dorm", length = 100)
    private String fromDorm;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "sold_count")
    private Integer soldCount = 0;

    @Column(length = 20)
    private String status = "active"; // active, sold, off, deleted

    @Column(name = "create_time")
    private Date createTime;

    @Column(name = "update_time")
    private Date updateTime;
}
