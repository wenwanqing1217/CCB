package com.campusblindbox.box.controller;

import com.campusblindbox.box.dto.BoxCreateRequest;
import com.campusblindbox.box.dto.BoxUpdateRequest;
import com.campusblindbox.box.entity.Box;
import com.campusblindbox.box.service.BoxService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/boxes")
public class BoxController {

    @Autowired
    private BoxService boxService;

    // 商家发布盲盒
    @PostMapping
    public ResponseEntity<Map<String, Object>> createBox(@RequestBody BoxCreateRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            Box box = boxService.createBox(request);
            result.put("success", true);
            result.put("data", box);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("发布盲盒失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    // 商家更新盲盒
    @PutMapping("/{boxId}")
    public ResponseEntity<Map<String, Object>> updateBox(
            @PathVariable String boxId,
            @RequestBody BoxUpdateRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            Box box = boxService.updateBox(boxId, request);
            if (box == null) {
                result.put("success", false);
                result.put("error", "盲盒不存在");
                return ResponseEntity.notFound().build();
            }
            result.put("success", true);
            result.put("data", box);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("更新盲盒失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    // 商家下架盲盒
    @PutMapping("/{boxId}/off")
    public ResponseEntity<Map<String, Object>> offBox(@PathVariable String boxId) {
        Map<String, Object> result = new HashMap<>();
        try {
            Box box = boxService.offBox(boxId);
            if (box == null) {
                result.put("success", false);
                result.put("error", "盲盒不存在");
                return ResponseEntity.notFound().build();
            }
            result.put("success", true);
            result.put("data", box);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("下架盲盒失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    // 查询盲盒详情
    @GetMapping("/{boxId}")
    public ResponseEntity<Map<String, Object>> getBoxDetail(@PathVariable String boxId) {
        Map<String, Object> result = new HashMap<>();
        try {
            Box box = boxService.getBoxDetail(boxId);
            if (box == null) {
                result.put("success", false);
                result.put("error", "盲盒不存在");
                return ResponseEntity.notFound().build();
            }
            result.put("success", true);
            result.put("data", box);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询盲盒详情失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    // 商家查询自己的盲盒列表
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Map<String, Object>> getSellerBoxes(
            @PathVariable String sellerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Map<String, Object> result = new HashMap<>();
        try {
            Page<Box> boxes = boxService.getSellerBoxes(sellerId, page, size);
            result.put("success", true);
            result.put("data", boxes.getContent());
            result.put("total", boxes.getTotalElements());
            result.put("pages", boxes.getTotalPages());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询商家盲盒列表失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    // 首页盲盒列表（买家）
    @GetMapping
    public ResponseEntity<Map<String, Object>> getBoxList(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> result = new HashMap<>();
        try {
            Page<Box> boxes = boxService.getBoxList(category, page, size);
            result.put("success", true);
            result.put("data", boxes.getContent());
            result.put("total", boxes.getTotalElements());
            result.put("pages", boxes.getTotalPages());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询盲盒列表失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    // 内部接口：扣除库存
    @PostMapping("/{boxId}/deduct")
    public ResponseEntity<Map<String, Object>> deductStock(
            @PathVariable String boxId,
            @RequestParam int quantity) {
        Map<String, Object> result = new HashMap<>();
        boolean success = boxService.deductStock(boxId, quantity);
        result.put("success", success);
        return ResponseEntity.ok(result);
    }

    // 内部接口：恢复库存
    @PostMapping("/{boxId}/restore")
    public ResponseEntity<Map<String, Object>> restoreStock(
            @PathVariable String boxId,
            @RequestParam int quantity) {
        Map<String, Object> result = new HashMap<>();
        boolean success = boxService.restoreStock(boxId, quantity);
        result.put("success", success);
        return ResponseEntity.ok(result);
    }
}
