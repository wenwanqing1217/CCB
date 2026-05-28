package com.campusblindbox.user;

import com.campusblindbox.user.utils.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        jwtUtils.secret = "test-secret-key-for-jwt-testing-1234567890";
        jwtUtils.expiration = 604800000L; // 7 days
    }

    @Test
    void testGenerateToken() {
        // When
        String token = jwtUtils.generateToken(1L, "openid_123", "BUYER");

        // Then
        assertNotNull(token);
        assertTrue(token.length() > 0);
    }

    @Test
    void testValidateToken_Valid() {
        // Given
        String token = jwtUtils.generateToken(1L, "openid_123", "BUYER");

        // When
        boolean isValid = jwtUtils.validateToken(token);

        // Then
        assertTrue(isValid);
    }

    @Test
    void testValidateToken_Invalid() {
        // Given
        String invalidToken = "invalid.token.here";

        // When
        boolean isValid = jwtUtils.validateToken(invalidToken);

        // Then
        assertFalse(isValid);
    }

    @Test
    void testGetUserIdFromToken() {
        // Given
        String token = jwtUtils.generateToken(123L, "openid_456", "MERCHANT");

        // When
        Long userId = jwtUtils.getUserIdFromToken(token);

        // Then
        assertEquals(123L, userId);
    }

    @Test
    void testGetOpenidFromToken() {
        // Given
        String token = jwtUtils.generateToken(1L, "my_openid", "BUYER");

        // When
        String openid = jwtUtils.getOpenidFromToken(token);

        // Then
        assertEquals("my_openid", openid);
    }

    @Test
    void testGetRoleFromToken() {
        // Given
        String token = jwtUtils.generateToken(1L, "openid", "RIDER");

        // When
        String role = jwtUtils.getRoleFromToken(token);

        // Then
        assertEquals("RIDER", role);
    }
}
