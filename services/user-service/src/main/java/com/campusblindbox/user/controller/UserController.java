package com.campusblindbox.user.controller;

import com.campusblindbox.user.dto.*;
import com.campusblindbox.user.entity.User;
import com.campusblindbox.user.service.UserService;
import com.campusblindbox.user.utils.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * 微信登录/注册
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = userService.login(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("登录失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("登录失败: " + e.getMessage()));
        }
    }

    /**
     * 查询当前用户信息
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
            }

            String token = authHeader.substring(7);
            if (!jwtUtils.validateToken(token)) {
                return ResponseEntity.status(401).body(ApiResponse.error("Token无效"));
            }

            Long userId = jwtUtils.getUserIdFromToken(token);
            if (userService.isTokenBlacklisted(userId)) {
                return ResponseEntity.status(401).body(ApiResponse.error("Token已失效"));
            }

            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("用户不存在"));
            }

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("openid", user.getOpenid());
            data.put("nickname", user.getNickname());
            data.put("avatar", user.getAvatar());
            data.put("phone", user.getPhone());
            data.put("role", user.getRole().name());
            data.put("status", user.getStatus().name());
            data.put("campus", user.getCampus());
            data.put("dormitory", user.getDormitory());

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("查询用户信息失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 查询用户信息（通过ID）
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserById(@PathVariable Long userId) {
        try {
            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("用户不存在"));
            }

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("nickname", user.getNickname());
            data.put("avatar", user.getAvatar());
            data.put("role", user.getRole().name());

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("查询用户失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserInfo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UserInfoRequest request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtils.getUserIdFromToken(token);

            User user = userService.updateUserInfo(userId, request);
            if (user == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("用户不存在"));
            }

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("nickname", user.getNickname());
            data.put("avatar", user.getAvatar());
            data.put("phone", user.getPhone());
            data.put("campus", user.getCampus());
            data.put("dormitory", user.getDormitory());

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("更新用户信息失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("更新失败: " + e.getMessage()));
        }
    }

    /**
     * 商家申请
     */
    @PostMapping("/apply/merchant")
    public ResponseEntity<ApiResponse<Map<String, Object>>> applyMerchant(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody MerchantApplyRequest request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtils.getUserIdFromToken(token);

            User user = userService.applyMerchant(userId, request);
            if (user == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("用户不存在"));
            }

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("role", user.getRole().name());
            data.put("status", user.getStatus().name());
            data.put("message", "申请已提交，等待管理员审核");

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("商家申请失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("申请失败: " + e.getMessage()));
        }
    }

    /**
     * 骑手申请
     */
    @PostMapping("/apply/rider")
    public ResponseEntity<ApiResponse<Map<String, Object>>> applyRider(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody RiderApplyRequest request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtils.getUserIdFromToken(token);

            User user = userService.applyRider(userId, request);
            if (user == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("用户不存在"));
            }

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("role", user.getRole().name());
            data.put("status", user.getStatus().name());
            data.put("message", "申请已提交，等待管理员审核");

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("骑手申请失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("申请失败: " + e.getMessage()));
        }
    }

    /**
     * 管理员：查询所有用户
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            // TODO: 权限校验，应该检查是否为管理员

            List<User> users;
            if (role != null && status != null) {
                users = userRepository.findByRoleAndStatus(
                        User.Role.valueOf(role),
                        User.Status.valueOf(status)
                );
            } else if (role != null) {
                users = userRepository.findByRole(User.Role.valueOf(role));
            } else if (status != null) {
                users = userRepository.findByStatus(User.Status.valueOf(status));
            } else {
                users = userRepository.findAll();
            }

            final int skip = (page - 1) * size;
            final int limit = size;
            List<Map<String, Object>> userList = users.stream()
                    .skip(skip)
                    .limit(limit)
                    .map(u -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("userId", u.getId());
                        map.put("openid", u.getOpenid());
                        map.put("nickname", u.getNickname());
                        map.put("avatar", u.getAvatar());
                        map.put("phone", u.getPhone());
                        map.put("role", u.getRole().name());
                        map.put("status", u.getStatus().name());
                        map.put("createTime", u.getCreateTime());
                        return map;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("users", userList);
            data.put("total", users.size());
            data.put("page", page);
            data.put("size", size);

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("查询用户列表失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 管理员：审核用户
     */
    @PostMapping("/{userId}/approve")
    public ResponseEntity<ApiResponse<String>> approveUser(@PathVariable Long userId) {
        try {
            // TODO: 权限校验
            boolean success = userService.approveUser(userId);
            if (!success) {
                return ResponseEntity.status(404).body(ApiResponse.error("用户不存在"));
            }
            return ResponseEntity.ok(ApiResponse.success("审核通过"));
        } catch (Exception e) {
            log.error("审核失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("审核失败: " + e.getMessage()));
        }
    }

    /**
     * 管理员：禁用/解禁用户
     */
    @PostMapping("/{userId}/toggle-status")
    public ResponseEntity<ApiResponse<String>> toggleUserStatus(
            @PathVariable Long userId,
            @RequestParam boolean ban) {
        try {
            // TODO: 权限校验
            boolean success = userService.toggleUserStatus(userId, ban);
            if (!success) {
                return ResponseEntity.status(404).body(ApiResponse.error("用户不存在"));
            }
            return ResponseEntity.ok(ApiResponse.success(ban ? "已禁用" : "已解禁"));
        } catch (Exception e) {
            log.error("状态变更失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("操作失败: " + e.getMessage()));
        }
    }

    /**
     * 登出
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtils.getUserIdFromToken(token);
            userService.logout(userId);

            return ResponseEntity.ok(ApiResponse.success("登出成功"));
        } catch (Exception e) {
            log.error("登出失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("登出失败: " + e.getMessage()));
        }
    }
}
