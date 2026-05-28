package com.campusblindbox.order.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderCreateRequest {
    private String boxId;
    private String buyerId;
    private String sellerId;
    private BigDecimal price;
    private BigDecimal deliveryFee;
    private String fromDorm;
    private String toDorm;
}
