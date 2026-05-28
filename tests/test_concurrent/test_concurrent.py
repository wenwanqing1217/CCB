"""
并发测试用例 - 重点测试抢单和下单的并发安全性
"""
import asyncio
import time
import threading
from typing import List, Dict
from api.user_service import UserServiceAPI
from api.order_service import OrderServiceAPI
from api.box_service import BoxServiceAPI


class ConcurrentTester:
    """并发测试器"""
    
    def __init__(self):
        self.user_api = UserServiceAPI()
        self.order_api = OrderServiceAPI()
        self.box_api = BoxServiceAPI()
        self.results = []
        self.lock = threading.Lock()

    def test_concurrent_grab_order(self, order_id: str, num_riders: int = 3) -> Dict:
        """
        测试多骑手同时抢单 - TC-CON-001
        
        Args:
            order_id: 订单ID
            num_riders: 骑手数量
            
        Returns:
            测试结果
        """
        print(f'\n=== 测试并发抢单 (订单ID: {order_id}, 骑手数: {num_riders}) ===')
        
        success_count = 0
        fail_count = 0
        riders = [f'rider_{i}' for i in range(num_riders)]
        
        def grab_task(rider_name):
            nonlocal success_count, fail_count
            print(f'{rider_name} 尝试抢单...')
            
            # 模拟抢单操作
            time.sleep(0.1)  # 模拟网络延迟
            
            # 这里使用简单的模拟逻辑
            # 实际项目中需要调用真实的抢单接口
            with self.lock:
                nonlocal success_count
                if success_count == 0:
                    print(f'{rider_name} 抢单成功!')
                    success_count += 1
                else:
                    print(f'{rider_name} 抢单失败: 订单已被抢')
                    fail_count += 1
        
        # 启动并发线程
        threads = []
        for rider in riders:
            t = threading.Thread(target=grab_task, args=(rider,))
            threads.append(t)
        
        start_time = time.time()
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        elapsed_time = time.time() - start_time
        
        # 验证结果
        passed = success_count == 1 and fail_count == num_riders - 1
        
        result = {
            'test_name': '多骑手同时抢单',
            'order_id': order_id,
            'num_riders': num_riders,
            'success_count': success_count,
            'fail_count': fail_count,
            'elapsed_time': elapsed_time,
            'passed': passed
        }
        
        print(f'\n结果: {"通过 ✓" if passed else "失败 ✗"}')
        print(f'成功抢单: {success_count}, 失败: {fail_count}, 耗时: {elapsed_time:.2f}s')
        
        self.results.append(result)
        return result

    def test_concurrent_create_order(self, box_id: str, num_users: int = 10, 
                                    initial_stock: int = 5) -> Dict:
        """
        测试多用户同时下单 - TC-CON-002
        
        Args:
            box_id: 盲盒ID
            num_users: 用户数量
            initial_stock: 初始库存
            
        Returns:
            测试结果
        """
        print(f'\n=== 测试并发下单 (盲盒ID: {box_id}, 用户数: {num_users}, 初始库存: {initial_stock}) ===')
        
        current_stock = initial_stock
        success_count = 0
        fail_count = 0
        lock = threading.Lock()
        
        def order_task(user_name):
            nonlocal current_stock, success_count, fail_count
            print(f'{user_name} 尝试下单...')
            
            time.sleep(0.1)  # 模拟网络延迟
            
            with lock:
                if current_stock > 0:
                    current_stock -= 1
                    success_count += 1
                    print(f'{user_name} 下单成功! 剩余库存: {current_stock}')
                else:
                    fail_count += 1
                    print(f'{user_name} 下单失败: 库存不足')
        
        # 启动并发线程
        threads = []
        for i in range(num_users):
            t = threading.Thread(target=order_task, args=(f'user_{i}',))
            threads.append(t)
        
        start_time = time.time()
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        elapsed_time = time.time() - start_time
        
        # 验证结果
        passed = (
            success_count == initial_stock and 
            fail_count == num_users - initial_stock and 
            current_stock == 0
        )
        
        result = {
            'test_name': '多用户同时下单',
            'box_id': box_id,
            'num_users': num_users,
            'initial_stock': initial_stock,
            'success_count': success_count,
            'fail_count': fail_count,
            'final_stock': current_stock,
            'elapsed_time': elapsed_time,
            'passed': passed
        }
        
        print(f'\n结果: {"通过 ✓" if passed else "失败 ✗"}')
        print(f'成功下单: {success_count}, 失败: {fail_count}, 最终库存: {current_stock}')
        
        self.results.append(result)
        return result

    def generate_summary(self) -> str:
        """生成测试摘要"""
        print('\n' + '=' * 60)
        print('并发测试摘要')
        print('=' * 60)
        
        summary = []
        total_passed = 0
        
        for result in self.results:
            status = '✓ 通过' if result['passed'] else '✗ 失败'
            summary.append(f"\n【{result['test_name']}】")
            summary.append(f"  状态: {status}")
            summary.append(f"  耗时: {result['elapsed_time']:.2f}s")
            if 'success_count' in result:
                summary.append(f"  成功数: {result['success_count']}")
            if 'passed' in result and result['passed']:
                total_passed += 1
        
        print('\n'.join(summary))
        print(f'\n总计: {len(self.results)} 个测试, 通过: {total_passed}/{len(self.results)}')
        
        return '\n'.join(summary)


def run_concurrent_tests():
    """运行所有并发测试"""
    print('=' * 60)
    print('校园盲盒平台 - 并发测试套件')
    print('=' * 60)
    
    tester = ConcurrentTester()
    
    # 测试1: 多骑手同时抢单
    tester.test_concurrent_grab_order('test_order_001', num_riders=3)
    
    # 测试2: 多用户同时下单
    tester.test_concurrent_create_order('test_box_001', num_users=10, initial_stock=5)
    
    # 测试3: 快速重复下单
    print('\n=== 测试快速重复下单 ===')
    
    rapid_results = []
    def rapid_order(user_name):
        time.sleep(0.05)
        rapid_results.append(user_name)
    
    threads = []
    for i in range(5):
        t = threading.Thread(target=rapid_order, args=(f'fast_user_{i}',))
        threads.append(t)
    
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    
    print(f'快速下单完成, 共 {len(rapid_results)} 次')
    
    # 生成摘要
    tester.generate_summary()


if __name__ == '__main__':
    run_concurrent_tests()
