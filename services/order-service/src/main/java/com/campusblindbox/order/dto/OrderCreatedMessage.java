package com.campusblindbox.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedMessage implements Serializable {
    private static final long serialVersionUID = 1L;

    private String orderId;
    private String boxId;
    private String buyerId;
    private String sellerId;
    private BigDecimal price;
    private BigDecimal deliveryFee;
    private String fromDorm;
    private String toDorm;
    private Long createTime;
}
