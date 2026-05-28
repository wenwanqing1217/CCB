package com.campusblindbox.order.service;

import com.alibaba.fastjson2.JSON;
import com.campusblindbox.order.dto.OrderCreateRequest;
import com.campusblindbox.order.dto.OrderCreatedMessage;
import com.campusblindbox.order.entity.Order;
import com.campusblindbox.order.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private RocketMQTemplate rocketMQTemplate;

    private static final String ORDER_CACHE_KEY = "order:detail:";

    // 创建订单
    @Transactional
    public Order createOrder(OrderCreateRequest request) {
        // 1. 生成订单ID（用UUID，生产环境可以用Snowflake）
        String orderId = UUID.randomUUID().toString().replace("-", "");

        // 2. 创建订单对象
        Order order = new Order();
        order.setId(orderId);
        order.setBoxId(request.getBoxId());
        order.setBuyerId(request.getBuyerId());
        order.setSellerId(request.getSellerId());
        order.setPrice(request.getPrice());
        order.setDeliveryFee(request.getDeliveryFee());
        order.setFromDorm(request.getFromDorm());
        order.setToDorm(request.getToDorm());
        order.setStatus("pending");
        order.setCreateTime(new Date());
        order.setUpdateTime(new Date());

        // 3. 保存到数据库
        order = orderRepository.save(order);
        log.info("订单创建成功: {}", orderId);

        // 4. 写入缓存
        String cacheKey = ORDER_CACHE_KEY + orderId;
        redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(order), 30, TimeUnit.MINUTES);
        log.info("订单写入缓存: {}", orderId);

        // 5. 发送消息到 RocketMQ
        OrderCreatedMessage message = new OrderCreatedMessage(
                orderId,
                request.getBoxId(),
                request.getBuyerId(),
                request.getSellerId(),
                request.getPrice(),
                request.getDeliveryFee(),
                request.getFromDorm(),
                request.getToDorm(),
                System.currentTimeMillis()
        );
        rocketMQTemplate.convertAndSend("ORDER_CREATED", message);
        log.info("订单消息发送成功: {}", orderId);

        return order;
    }

    // 查询订单详情
    public Order getOrderDetail(String orderId) {
        // 1. 先查缓存
        String cacheKey = ORDER_CACHE_KEY + orderId;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            log.info("从缓存获取订单: {}", orderId);
            return JSON.parseObject(cached, Order.class);
        }

        // 2. 缓存未命中，查数据库
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            // 3. 写入缓存
            redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(order), 30, TimeUnit.MINUTES);
        }

        return order;
    }

    // 更新订单状态
    @Transactional
    public Order updateOrderStatus(String orderId, String status) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return null;
        }

        order.setStatus(status);
        order.setUpdateTime(new Date());
        order = orderRepository.save(order);
        log.info("订单状态更新: {} -> {}", orderId, status);

        // 删缓存（下次查询时重新加载）
        String cacheKey = ORDER_CACHE_KEY + orderId;
        redisTemplate.delete(cacheKey);

        return order;
    }
}
