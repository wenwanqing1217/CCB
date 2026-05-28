"""
用户服务接口封装
"""
import requests
from typing import Dict, Optional, Tuple
from config import SERVICE_CONFIG


class UserServiceAPI:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or SERVICE_CONFIG['user_service']
        self.session = requests.Session()
        self.token: Optional[str] = None

    def set_token(self, token: str) -> None:
        """设置认证Token"""
        self.token = token
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })

    def clear_token(self) -> None:
        """清除Token"""
        self.token = None
        self.session.headers.pop('Authorization', None)

    def login(self, openid: str, nickname: Optional[str] = None, avatar: Optional[str] = None) -> Tuple[bool, Optional[Dict]]:
        """
        登录/注册
        
        Args:
            openid: 微信OpenID
            nickname: 昵称
            avatar: 头像
            
        Returns:
            (是否成功, 响应数据)
        """
        url = f'{self.base_url}/api/users/login'
        payload = {
            'openid': openid,
            'nickname': nickname,
            'avatar': avatar
        }
        
        try:
            response = self.session.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'登录请求异常: {e}')
            return False, None

    def get_current_user(self) -> Tuple[bool, Optional[Dict]]:
        """
        获取当前用户信息
        
        Returns:
            (是否成功, 用户信息)
        """
        url = f'{self.base_url}/api/users/me'
        
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'获取用户信息异常: {e}')
            return False, None

    def update_user_info(self, user_info: Dict) -> Tuple[bool, Optional[Dict]]:
        """
        更新用户信息
        
        Args:
            user_info: 用户信息字典
            
        Returns:
            (是否成功, 更新后信息)
        """
        url = f'{self.base_url}/api/users/me'
        
        try:
            response = self.session.put(url, json=user_info, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'更新用户信息异常: {e}')
            return False, None

    def apply_merchant(self, merchant_info: Dict) -> Tuple[bool, Optional[Dict]]:
        """
        申请商家
        
        Args:
            merchant_info: 商家信息
            
        Returns:
            (是否成功, 响应数据)
        """
        url = f'{self.base_url}/api/users/apply/merchant'
        
        try:
            response = self.session.post(url, json=merchant_info, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'申请商家异常: {e}')
            return False, None

    def apply_rider(self, rider_info: Dict) -> Tuple[bool, Optional[Dict]]:
        """
        申请骑手
        
        Args:
            rider_info: 骑手信息
            
        Returns:
            (是否成功, 响应数据)
        """
        url = f'{self.base_url}/api/users/apply/rider'
        
        try:
            response = self.session.post(url, json=rider_info, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'申请骑手异常: {e}')
            return False, None
