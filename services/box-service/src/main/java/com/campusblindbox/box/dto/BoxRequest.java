package com.campusblindbox.box.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BoxCreateRequest {
    private String sellerId;
    private String title;
    private String description;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String category;
    private List<String> tags;
    private List<String> images;
    private String fromDorm;
    private Integer stock;
}

@Data
public class BoxUpdateRequest {
    private String title;
    private String description;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String category;
    private List<String> tags;
    private List<String> images;
    private String fromDorm;
    private Integer stock;
}
