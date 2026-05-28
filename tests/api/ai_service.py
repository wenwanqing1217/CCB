"""
AI服务接口封装（云函数模拟调用）
"""
import time
import asyncio
import aiohttp
from typing import Dict, Optional, Tuple, List
from config import AI_TEST_CONFIG


class AIServiceAPI:
    def __init__(self):
        pass

    def chat(self, question: str, history: Optional[List] = None, 
             user_id: Optional[str] = None) -> Tuple[bool, Optional[Dict], float]:
        """
        发送AI对话请求（同步）
        
        Args:
            question: 用户问题
            history: 历史对话
            user_id: 用户ID
            
        Returns:
            (是否成功, 响应数据, 响应时间)
        """
        start_time = time.time()
        
        # 模拟调用云函数
        try:
            # 这里替换为实际的云函数调用方式
            # 目前返回模拟响应
            mock_response = {
                'success': True,
                'data': f'这是关于"{question}"的模拟回答',
                'suggestions': ['追问1', '追问2', '追问3']
            }
            
            # 模拟网络延迟
            time.sleep(0.5)
            
            elapsed_time = time.time() - start_time
            return True, mock_response, elapsed_time
        except Exception as e:
            elapsed_time = time.time() - start_time
            print(f'AI请求异常: {e}')
            return False, None, elapsed_time

    async def chat_async(self, question: str, history: Optional[List] = None,
                         user_id: Optional[str] = None) -> Tuple[bool, Optional[Dict], float]:
        """
        发送AI对话请求（异步）
        
        Args:
            question: 用户问题
            history: 历史对话
            user_id: 用户ID
            
        Returns:
            (是否成功, 响应数据, 响应时间)
        """
        start_time = time.time()
        
        try:
            # 异步模拟响应
            mock_response = {
                'success': True,
                'data': f'异步回答: {question}',
                'suggestions': ['异步追问1', '异步追问2']
            }
            
            await asyncio.sleep(0.5)
            
            elapsed_time = time.time() - start_time
            return True, mock_response, elapsed_time
        except Exception as e:
            elapsed_time = time.time() - start_time
            print(f'异步AI请求异常: {e}')
            return False, None, elapsed_time

    async def batch_chat(self, questions: List[str], user_id: Optional[str] = None) -> List[Dict]:
        """
        批量AI对话（并发）
        
        Args:
            questions: 问题列表
            user_id: 用户ID
            
        Returns:
            结果列表
        """
        tasks = []
        for question in questions:
            task = self.chat_async(question, user_id=user_id)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        # 整理结果
        formatted_results = []
        for i, (success, data, elapsed_time) in enumerate(results):
            formatted_results.append({
                'index': i,
                'question': questions[i],
                'success': success,
                'response': data,
                'response_time': elapsed_time
            })
        
        return formatted_results

    def evaluate_answer_quality(self, question: str, answer: str) -> Dict:
        """
        评估回答质量（简化版）
        
        Args:
            question: 问题
            answer: 回答
            
        Returns:
            评估结果
        """
        score = 0
        feedback = []
        
        # 长度检查
        if 10 <= len(answer) <= 500:
            score += 20
        else:
            feedback.append('回答长度不合理')
        
        # 相关性检查（关键词匹配）
        keywords = ['盲盒', '配送', '订单', '用户', '平台']
        has_related = any(kw in answer for kw in keywords)
        if has_related:
            score += 30
        else:
            feedback.append('回答可能不相关')
        
        # 完整性检查
        if '请' in answer or '建议' in answer or '可以' in answer:
            score += 20
        
        # 友好度检查
        if '！' in answer or '您好' in answer or '谢谢' in answer:
            score += 10
        
        return {
            'score': score,
            'max_score': 100,
            'feedback': feedback,
            'pass': score >= 60
        }
