package com.campusblindbox.order.controller;

import com.campusblindbox.order.dto.OrderCreateRequest;
import com.campusblindbox.order.entity.Order;
import com.campusblindbox.order.service.OrderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // 创建订单
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody OrderCreateRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            Order order = orderService.createOrder(request);
            result.put("success", true);
            result.put("data", order);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("创建订单失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    // 查询订单详情
    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderDetail(@PathVariable String orderId) {
        Map<String, Object> result = new HashMap<>();
        try {
            Order order = orderService.getOrderDetail(orderId);
            if (order == null) {
                result.put("success", false);
                result.put("error", "订单不存在");
                return ResponseEntity.notFound().build();
            }
            result.put("success", true);
            result.put("data", order);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询订单失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    // 更新订单状态
    @PutMapping("/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable String orderId,
            @RequestParam String status
    ) {
        Map<String, Object> result = new HashMap<>();
        try {
            Order order = orderService.updateOrderStatus(orderId, status);
            if (order == null) {
                result.put("success", false);
                result.put("error", "订单不存在");
                return ResponseEntity.notFound().build();
            }
            result.put("success", true);
            result.put("data", order);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("更新订单状态失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
}
