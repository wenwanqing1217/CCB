package com.campusblindbox.user.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class LoginRequest {
    @NotBlank(message = "OpenID不能为空")
    private String openid;

    private String nickname;

    private String avatar;
}

@Data
public class LoginResponse {
    private String token;
    private Long userId;
    private String openid;
    private String nickname;
    private String avatar;
    private String role;
    private String status;
}

@Data
public class UserInfoRequest {
    private String nickname;
    private String avatar;
    private String phone;
    private String campus;
    private String dormitory;
}

@Data
public class MerchantApplyRequest {
    private String merchantName;  // 商家名称
    private String businessLicense;  // 营业执照
    private String contactPhone;  // 联系电话
    private String description;  // 商家描述
}

@Data
public class RiderApplyRequest {
    private String idCard;  // 身份证号
    private String realName;  // 真实姓名
    private String idCardFront;  // 身份证正面
    private String idCardBack;  // 身份证背面
}

@Data
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String error;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setData(data);
        return response;
    }

    public static <T> ApiResponse<T> error(String error) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setError(error);
        return response;
    }
}
