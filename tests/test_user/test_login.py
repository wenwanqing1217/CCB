"""
测试用户服务 - 登录/注册
"""
import pytest
from api.user_service import UserServiceAPI
from config import TEST_USERS


class TestUserLogin:
    @pytest.fixture
    def user_api(self):
        return UserServiceAPI()

    def test_new_user_login_success(self, user_api):
        """TC-US-001: 新用户正常注册"""
        buyer = TEST_USERS['buyer']
        success, data = user_api.login(
            openid=buyer['openid'],
            nickname=buyer['nickname']
        )
        
        assert success is True, '登录应该成功'
        assert data is not None, '应该返回用户数据'
        assert 'userId' in data, '应该有userId'
        assert 'token' in data, '应该有token'
        assert data.get('nickname') == buyer['nickname'], '昵称应该一致'
        assert data.get('role') == 'BUYER', '默认角色应该是BUYER'

    def test_login_without_nickname(self, user_api):
        """TC-US-003: 不传nickname使用默认值"""
        success, data = user_api.login(
            openid='test_openid_no_nickname_001'
        )
        
        assert success is True
        assert data.get('nickname') == '新用户', '应该使用默认昵称'

    def test_login_empty_openid(self, user_api):
        """TC-US-004: 空OpenID登录"""
        success, data = user_api.login(openid='')
        
        assert success is False, '空OpenID应该失败'

    def test_get_current_user_with_token(self, user_api):
        """TC-US-006: 获取当前用户信息"""
        # 先登录
        login_success, login_data = user_api.login(
            openid='test_openid_get_user_001',
            nickname='获取用户测试'
        )
        assert login_success is True, '登录应该成功'
        
        # 设置token
        token = login_data['token']
        user_api.set_token(token)
        
        # 获取用户信息
        success, user_info = user_api.get_current_user()
        
        assert success is True, '获取用户信息应该成功'
        assert user_info is not None
        assert user_info.get('userId') == login_data['userId'], '用户ID应该一致'

    def test_get_current_user_without_token(self, user_api):
        """TC-US-007: 无Token获取信息"""
        # 不设置token
        user_api.clear_token()
        
        success, user_info = user_api.get_current_user()
        
        assert success is False, '无Token应该失败'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
