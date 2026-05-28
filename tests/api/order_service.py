"""
订单服务接口封装
"""
import requests
from typing import Dict, Optional, Tuple
from config import SERVICE_CONFIG


class OrderServiceAPI:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or SERVICE_CONFIG['order_service']
        self.session = requests.Session()

    def create_order(self, order_info: Dict) -> Tuple[bool, Optional[Dict]]:
        """
        创建订单
        
        Args:
            order_info: 订单信息
            
        Returns:
            (是否成功, 订单数据)
        """
        url = f'{self.base_url}/api/orders'
        
        try:
            response = self.session.post(url, json=order_info, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'创建订单异常: {e}')
            return False, None

    def get_order_detail(self, order_id: str) -> Tuple[bool, Optional[Dict]]:
        """
        获取订单详情
        
        Args:
            order_id: 订单ID
            
        Returns:
            (是否成功, 订单数据)
        """
        url = f'{self.base_url}/api/orders/{order_id}'
        
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'获取订单详情异常: {e}')
            return False, None

    def get_user_orders(self, user_id: int, status: Optional[str] = None,
                       page: int = 0, size: int = 20) -> Tuple[bool, Optional[Dict]]:
        """
        获取用户订单列表
        
        Args:
            user_id: 用户ID
            status: 状态筛选
            page: 页码
            size: 每页数量
            
        Returns:
            (是否成功, 订单列表)
        """
        url = f'{self.base_url}/api/orders/user/{user_id}'
        params = {'page': page, 'size': size}
        if status:
            params['status'] = status
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return True, data
            return False, None
        except Exception as e:
            print(f'获取用户订单异常: {e}')
            return False, None

    def update_order_status(self, order_id: str, status: str) -> Tuple[bool, Optional[Dict]]:
        """
        更新订单状态
        
        Args:
            order_id: 订单ID
            status: 新状态
            
        Returns:
            (是否成功, 响应数据)
        """
        url = f'{self.base_url}/api/orders/{order_id}/status'
        
        try:
            response = self.session.put(url, json={'status': status}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'更新订单状态异常: {e}')
            return False, None
