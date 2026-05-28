"""
盲盒服务接口封装
"""
import requests
from typing import Dict, Optional, Tuple, List
from config import SERVICE_CONFIG


class BoxServiceAPI:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or SERVICE_CONFIG['box_service']
        self.session = requests.Session()

    def create_box(self, box_info: Dict) -> Tuple[bool, Optional[Dict]]:
        """
        发布盲盒
        
        Args:
            box_info: 盲盒信息字典
            
        Returns:
            (是否成功, 盲盒数据)
        """
        url = f'{self.base_url}/api/boxes'
        
        try:
            response = self.session.post(url, json=box_info, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'发布盲盒异常: {e}')
            return False, None

    def get_box_list(self, category: Optional[str] = None,
                    page: int = 0, size: int = 20) -> Tuple[bool, Optional[Dict]]:
        """
        获取盲盒列表
        
        Args:
            category: 分类筛选
            page: 页码
            size: 每页数量
            
        Returns:
            (是否成功, 列表数据)
        """
        url = f'{self.base_url}/api/boxes'
        params = {'page': page, 'size': size}
        if category:
            params['category'] = category
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return True, data
            return False, None
        except Exception as e:
            print(f'获取盲盒列表异常: {e}')
            return False, None

    def get_box_detail(self, box_id: str) -> Tuple[bool, Optional[Dict]]:
        """
        获取盲盒详情
        
        Args:
            box_id: 盲盒ID
            
        Returns:
            (是否成功, 盲盒数据)
        """
        url = f'{self.base_url}/api/boxes/{box_id}'
        
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'获取盲盒详情异常: {e}')
            return False, None

    def update_box(self, box_id: str, box_info: Dict) -> Tuple[bool, Optional[Dict]]:
        """
        更新盲盒
        
        Args:
            box_id: 盲盒ID
            box_info: 更新信息
            
        Returns:
            (是否成功, 更新后数据)
        """
        url = f'{self.base_url}/api/boxes/{box_id}'
        
        try:
            response = self.session.put(url, json=box_info, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'更新盲盒异常: {e}')
            return False, None

    def off_box(self, box_id: str) -> Tuple[bool, Optional[Dict]]:
        """
        下架盲盒
        
        Args:
            box_id: 盲盒ID
            
        Returns:
            (是否成功, 响应数据)
        """
        url = f'{self.base_url}/api/boxes/{box_id}/off'
        
        try:
            response = self.session.put(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True, data.get('data')
            return False, None
        except Exception as e:
            print(f'下架盲盒异常: {e}')
            return False, None
