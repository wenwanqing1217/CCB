package com.campusblindbox.user;

import com.campusblindbox.user.dto.LoginRequest;
import com.campusblindbox.user.dto.LoginResponse;
import com.campusblindbox.user.entity.User;
import com.campusblindbox.user.repository.UserRepository;
import com.campusblindbox.user.service.UserService;
import com.campusblindbox.user.utils.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLogin_NewUser() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setOpenid("test_openid_123");
        request.setNickname("测试用户");
        request.setAvatar("https://example.com/avatar.jpg");

        User newUser = new User();
        newUser.setId(1L);
        newUser.setOpenid("test_openid_123");
        newUser.setNickname("测试用户");
        newUser.setAvatar("https://example.com/avatar.jpg");
        newUser.setRole(User.Role.BUYER);
        newUser.setStatus(User.Status.ACTIVE);

        when(userRepository.findByOpenid("test_openid_123")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(newUser);
        when(jwtUtils.generateToken(anyLong(), anyString(), anyString())).thenReturn("mock_token_123");

        // When
        LoginResponse response = userService.login(request);

        // Then
        assertNotNull(response);
        assertEquals("mock_token_123", response.getToken());
        assertEquals(1L, response.getUserId());
        assertEquals("BUYER", response.getRole());
        assertEquals("ACTIVE", response.getStatus());

        verify(userRepository).findByOpenid("test_openid_123");
        verify(userRepository).save(any(User.class));
        verify(jwtUtils).generateToken(1L, "test_openid_123", "BUYER");
    }

    @Test
    void testLogin_ExistingUser() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setOpenid("existing_openid");

        User existingUser = new User();
        existingUser.setId(2L);
        existingUser.setOpenid("existing_openid");
        existingUser.setNickname("老用户");
        existingUser.setRole(User.Role.MERCHANT);
        existingUser.setStatus(User.Status.ACTIVE);

        when(userRepository.findByOpenid("existing_openid")).thenReturn(Optional.of(existingUser));
        when(jwtUtils.generateToken(2L, "existing_openid", "MERCHANT")).thenReturn("existing_token");

        // When
        LoginResponse response = userService.login(request);

        // Then
        assertNotNull(response);
        assertEquals("existing_token", response.getToken());
        assertEquals(2L, response.getUserId());
        assertEquals("MERCHANT", response.getRole());

        verify(userRepository).findByOpenid("existing_openid");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLogin_WithDefaultNickname() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setOpenid("new_openid_no_nickname");
        // nickname not set

        User newUser = new User();
        newUser.setId(3L);
        newUser.setOpenid("new_openid_no_nickname");
        newUser.setNickname("新用户");  // 默认昵称
        newUser.setRole(User.Role.BUYER);
        newUser.setStatus(User.Status.ACTIVE);

        when(userRepository.findByOpenid("new_openid_no_nickname")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(newUser);
        when(jwtUtils.generateToken(anyLong(), anyString(), anyString())).thenReturn("token");

        // When
        LoginResponse response = userService.login(request);

        // Then
        assertNotNull(response);
        assertEquals("新用户", response.getNickname());
    }

    @Test
    void testGetUserById() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setOpenid("test_openid");
        user.setNickname("测试");
        user.setRole(User.Role.BUYER);
        user.setStatus(User.Status.ACTIVE);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // When
        User result = userService.getUserById(1L);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("test_openid", result.getOpenid());
    }

    @Test
    void testGetUserById_NotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        User result = userService.getUserById(999L);

        // Then
        assertNull(result);
    }

    @Test
    void testApproveUser() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setStatus(User.Status.PENDING);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        boolean result = userService.approveUser(1L);

        // Then
        assertTrue(result);
        assertEquals(User.Status.ACTIVE, user.getStatus());
        assertEquals(User.Role.MERCHANT, user.getRole());
        verify(userRepository).save(user);
    }

    @Test
    void testToggleUserStatus_Ban() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setStatus(User.Status.ACTIVE);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        boolean result = userService.toggleUserStatus(1L, true);

        // Then
        assertTrue(result);
        assertEquals(User.Status.BANNED, user.getStatus());
    }

    @Test
    void testToggleUserStatus_Unban() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setStatus(User.Status.BANNED);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        boolean result = userService.toggleUserStatus(1L, false);

        // Then
        assertTrue(result);
        assertEquals(User.Status.ACTIVE, user.getStatus());
    }
}
