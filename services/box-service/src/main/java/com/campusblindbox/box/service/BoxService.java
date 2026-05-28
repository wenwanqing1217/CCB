package com.campusblindbox.box.service;

import com.alibaba.fastjson2.JSON;
import com.campusblindbox.box.dto.BoxCreateRequest;
import com.campusblindbox.box.dto.BoxUpdateRequest;
import com.campusblindbox.box.entity.Box;
import com.campusblindbox.box.repository.BoxRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class BoxService {

    @Autowired
    private BoxRepository boxRepository;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String BOX_CACHE_KEY = "box:detail:";
    private static final String HOT_BOXES_CACHE_KEY = "box:hot";

    // 商家发布盲盒
    @Transactional
    public Box createBox(BoxCreateRequest request) {
        Box box = new Box();
        box.setId(UUID.randomUUID().toString().replace("-", ""));
        box.setSellerId(request.getSellerId());
        box.setTitle(request.getTitle());
        box.setDescription(request.getDescription());
        box.setPrice(request.getPrice());
        box.setOriginalPrice(request.getOriginalPrice());
        box.setCategory(request.getCategory());
        box.setTags(request.getTags());
        box.setImages(request.getImages());
        box.setFromDorm(request.getFromDorm());
        box.setStock(request.getStock());
        box.setSoldCount(0);
        box.setStatus("active");
        box.setCreateTime(new Date());
        box.setUpdateTime(new Date());

        box = boxRepository.save(box);
        log.info("商家发布盲盒: {} - {}", request.getSellerId(), box.getId());

        // 清除热门缓存
        redisTemplate.delete(HOT_BOXES_CACHE_KEY);

        return box;
    }

    // 商家更新盲盒
    @Transactional
    public Box updateBox(String boxId, BoxUpdateRequest request) {
        Box box = boxRepository.findById(boxId).orElse(null);
        if (box == null) {
            return null;
        }

        if (request.getTitle() != null) box.setTitle(request.getTitle());
        if (request.getDescription() != null) box.setDescription(request.getDescription());
        if (request.getPrice() != null) box.setPrice(request.getPrice());
        if (request.getOriginalPrice() != null) box.setOriginalPrice(request.getOriginalPrice());
        if (request.getCategory() != null) box.setCategory(request.getCategory());
        if (request.getTags() != null) box.setTags(request.getTags());
        if (request.getImages() != null) box.setImages(request.getImages());
        if (request.getFromDorm() != null) box.setFromDorm(request.getFromDorm());
        if (request.getStock() != null) box.setStock(request.getStock());
        box.setUpdateTime(new Date());

        box = boxRepository.save(box);
        log.info("商家更新盲盒: {}", boxId);

        // 清除缓存
        redisTemplate.delete(BOX_CACHE_KEY + boxId);
        redisTemplate.delete(HOT_BOXES_CACHE_KEY);

        return box;
    }

    // 商家下架盲盒
    @Transactional
    public Box offBox(String boxId) {
        Box box = boxRepository.findById(boxId).orElse(null);
        if (box == null) {
            return null;
        }

        box.setStatus("off");
        box.setUpdateTime(new Date());
        box = boxRepository.save(box);
        log.info("商家下架盲盒: {}", boxId);

        // 清除缓存
        redisTemplate.delete(BOX_CACHE_KEY + boxId);
        redisTemplate.delete(HOT_BOXES_CACHE_KEY);

        return box;
    }

    // 查询盲盒详情（买家/商家）
    public Box getBoxDetail(String boxId) {
        // 先查缓存
        String cacheKey = BOX_CACHE_KEY + boxId;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            log.info("从缓存获取盲盒: {}", boxId);
            return JSON.parseObject(cached, Box.class);
        }

        // 缓存未命中
        Box box = boxRepository.findById(boxId).orElse(null);
        if (box != null) {
            redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(box), 30, TimeUnit.MINUTES);
        }

        return box;
    }

    // 查询商家的盲盒列表
    public Page<Box> getSellerBoxes(String sellerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return boxRepository.findBySellerId(sellerId, pageable);
    }

    // 查询首页盲盒列表（买家）
    public Page<Box> getBoxList(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "soldCount"));
        
        if (category == null || category.isEmpty()) {
            return boxRepository.findByStatus("active", pageable);
        } else {
            return boxRepository.findByStatusAndCategory("active", category, pageable);
        }
    }

    // 扣除库存（被订单服务调用）
    @Transactional
    public boolean deductStock(String boxId, int quantity) {
        Box box = boxRepository.findById(boxId).orElse(null);
        if (box == null || box.getStock() < quantity) {
            return false;
        }

        box.setStock(box.getStock() - quantity);
        box.setSoldCount(box.getSoldCount() + quantity);
        if (box.getStock() <= 0) {
            box.setStatus("sold");
        }
        box.setUpdateTime(new Date());
        boxRepository.save(box);
        log.info("扣除库存: {} - {}", boxId, quantity);

        // 清除缓存
        redisTemplate.delete(BOX_CACHE_KEY + boxId);

        return true;
    }

    // 恢复库存（订单取消）
    @Transactional
    public boolean restoreStock(String boxId, int quantity) {
        Box box = boxRepository.findById(boxId).orElse(null);
        if (box == null) {
            return false;
        }

        box.setStock(box.getStock() + quantity);
        box.setSoldCount(Math.max(0, box.getSoldCount() - quantity));
        if ("sold".equals(box.getStatus()) && box.getStock() > 0) {
            box.setStatus("active");
        }
        box.setUpdateTime(new Date());
        boxRepository.save(box);
        log.info("恢复库存: {} - {}", boxId, quantity);

        // 清除缓存
        redisTemplate.delete(BOX_CACHE_KEY + boxId);

        return true;
    }
}
