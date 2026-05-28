package com.campusblindbox.user.service;

import com.campusblindbox.user.dto.*;
import com.campusblindbox.user.entity.User;
import com.campusblindbox.user.repository.UserRepository;
import com.campusblindbox.user.utils.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String USER_CACHE_KEY = "user:";
    private static final String TOKEN_BLACKLIST_KEY = "token:blacklist:";

    /**
     * 微信登录/注册
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        // 查询用户是否存在
        User user = userRepository.findByOpenid(request.getOpenid()).orElse(null);

        if (user == null) {
            // 新用户注册
            user = new User();
            user.setOpenid(request.getOpenid());
            user.setNickname(request.getNickname() != null ? request.getNickname() : "新用户");
            user.setAvatar(request.getAvatar());
            user.setRole(User.Role.BUYER);
            user.setStatus(User.Status.ACTIVE);
            user = userRepository.save(user);
            log.info("新用户注册: openid={}, userId={}", request.getOpenid(), user.getId());
        }

        // 生成Token
        String token = jwtUtils.generateToken(user.getId(), user.getOpenid(), user.getRole().name());

        // 返回登录响应
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setOpenid(user.getOpenid());
        response.setNickname(user.getNickname());
        response.setAvatar(user.getAvatar());
        response.setRole(user.getRole().name());
        response.setStatus(user.getStatus().name());

        // 缓存用户信息
        redisTemplate.opsForValue().set(
                USER_CACHE_KEY + user.getId(),
                user.getOpenid(),
                30,
                TimeUnit.MINUTES
        );

        log.info("用户登录成功: userId={}, role={}", user.getId(), user.getRole());
        return response;
    }

    /**
     * 查询用户信息
     */
    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    /**
     * 查询用户信息（通过OpenID）
     */
    public User getUserByOpenid(String openid) {
        return userRepository.findByOpenid(openid).orElse(null);
    }

    /**
     * 更新用户信息
     */
    @Transactional
    public User updateUserInfo(Long userId, UserInfoRequest request) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getCampus() != null) {
            user.setCampus(request.getCampus());
        }
        if (request.getDormitory() != null) {
            user.setDormitory(request.getDormitory());
        }

        user = userRepository.save(user);
        log.info("用户信息更新: userId={}", userId);

        // 清除缓存
        redisTemplate.delete(USER_CACHE_KEY + userId);

        return user;
    }

    /**
     * 商家申请
     */
    @Transactional
    public User applyMerchant(Long userId, MerchantApplyRequest request) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        user.setRole(User.Role.MERCHANT);
        user.setStatus(User.Status.PENDING);  // 待审核
        user = userRepository.save(user);

        log.info("商家申请: userId={}", userId);
        return user;
    }

    /**
     * 骑手申请
     */
    @Transactional
    public User applyRider(Long userId, RiderApplyRequest request) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        user.setRole(User.Role.RIDER);
        user.setStatus(User.Status.PENDING);  // 待审核
        user = userRepository.save(user);

        log.info("骑手申请: userId={}", userId);
        return user;
    }

    /**
     * 审核通过（管理员操作）
     */
    @Transactional
    public boolean approveUser(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }

        user.setStatus(User.Status.ACTIVE);
        userRepository.save(user);

        log.info("用户审核通过: userId={}, role={}", userId, user.getRole());
        return true;
    }

    /**
     * 禁用/解禁用户（管理员操作）
     */
    @Transactional
    public boolean toggleUserStatus(Long userId, boolean ban) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }

        user.setStatus(ban ? User.Status.BANNED : User.Status.ACTIVE);
        userRepository.save(user);

        // 如果禁用，加入黑名单
        if (ban) {
            redisTemplate.opsForValue().set(
                    TOKEN_BLACKLIST_KEY + userId,
                    "1",
                    7,
                    TimeUnit.DAYS
            );
        }

        log.info("用户状态变更: userId={}, banned={}", userId, ban);
        return true;
    }

    /**
     * 检查Token是否在黑名单
     */
    public boolean isTokenBlacklisted(Long userId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(TOKEN_BLACKLIST_KEY + userId));
    }

    /**
     * 登出（加入黑名单）
     */
    public void logout(Long userId) {
        redisTemplate.opsForValue().set(
                TOKEN_BLACKLIST_KEY + userId,
                "1",
                7,
                TimeUnit.DAYS
        );
        redisTemplate.delete(USER_CACHE_KEY + userId);
        log.info("用户登出: userId={}", userId);
    }
}
