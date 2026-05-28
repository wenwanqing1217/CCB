"""
AI接口专项评测脚本
功能：
1. 基础功能测试（正常/异常输入）
2. 回答质量评估
3. 性能测试（响应时间、并发）
4. 多轮对话测试
5. 生成评测报告
"""
import asyncio
import time
from typing import List, Dict
from datetime import datetime
from api.ai_service import AIServiceAPI
from config import (
    TEST_QUESTIONS,
    SENSITIVE_QUESTIONS,
    AI_TEST_CONFIG
)


class AIServiceEvaluator:
    def __init__(self):
        self.ai_api = AIServiceAPI()
        self.evaluation_results = {
            'basic_test': {},
            'quality_test': [],
            'performance_test': {},
            'multiround_test': {},
            'summary': {}
        }

    def run_basic_test(self) -> Dict:
        """
        基础功能测试
        """
        print('=' * 50)
        print('开始基础功能测试')
        print('=' * 50)

        results = {
            'normal_questions': [],
            'sensitive_questions': [],
            'edge_cases': []
        }

        # 1. 正常问题测试
        print('\n[1/4] 正常问题测试...')
        for question in TEST_QUESTIONS:
            print(f'  测试问题: {question}')
            success, data, response_time = self.ai_api.chat(question)
            
            result = {
                'question': question,
                'success': success,
                'response_time': response_time,
                'answer': data.get('data') if data else None,
                'has_suggestions': data and 'suggestions' in data
            }
            results['normal_questions'].append(result)
            print(f'    结果: {"通过" if success else "失败"}, 耗时: {response_time:.2f}s')

        # 2. 敏感问题测试
        print('\n[2/4] 敏感问题测试...')
        for question in SENSITIVE_QUESTIONS:
            print(f'  测试问题: {question}')
            success, data, response_time = self.ai_api.chat(question)
            
            result = {
                'question': question,
                'success': success,
                'response_time': response_time,
                'answer': data.get('data') if data else None
            }
            results['sensitive_questions'].append(result)
            print(f'    结果: {"通过" if success else "失败"}')

        # 3. 边界情况测试
        print('\n[3/4] 边界情况测试...')
        edge_cases = [
            ('空字符串', ''),
            ('超长文本', '测试内容' * 1000),
            ('特殊字符', '!@#$%^&*()_+'),
            ('纯数字', '123456'),
            ('纯空格', '    '),
        ]
        
        for case_name, question in edge_cases:
            print(f'  测试: {case_name}')
            success, data, response_time = self.ai_api.chat(question)
            
            result = {
                'case': case_name,
                'question': question,
                'success': success,
                'response_time': response_time
            }
            results['edge_cases'].append(result)
            print(f'    结果: {"通过" if success else "失败"}')

        self.evaluation_results['basic_test'] = results
        return results

    def run_quality_test(self) -> List[Dict]:
        """
        回答质量评估
        """
        print('\n' + '=' * 50)
        print('开始回答质量评估')
        print('=' * 50)

        quality_results = []
        
        for question in TEST_QUESTIONS[:5]:  # 取前5个测试
            print(f'\n  问题: {question}')
            success, data, response_time = self.ai_api.chat(question)
            
            if success and data:
                answer = data.get('data', '')
                evaluation = self.ai_api.evaluate_answer_quality(question, answer)
                
                result = {
                    'question': question,
                    'answer': answer,
                    'score': evaluation['score'],
                    'max_score': evaluation['max_score'],
                    'pass': evaluation['pass'],
                    'feedback': evaluation['feedback']
                }
                quality_results.append(result)
                print(f'    得分: {evaluation["score"]}/{evaluation["max_score"]}')
                print(f'    是否通过: {"是" if evaluation["pass"] else "否"}')

        self.evaluation_results['quality_test'] = quality_results
        return quality_results

    async def run_performance_test(self) -> Dict:
        """
        性能测试（并发、响应时间）
        """
        print('\n' + '=' * 50)
        print('开始性能测试')
        print('=' * 50)

        results = {
            'single_request': {},
            'concurrent_request': {}
        }

        # 1. 单次请求响应时间测试
        print('\n[1/2] 单次请求响应时间测试...')
        times = []
        for i in range(AI_TEST_CONFIG['test_rounds']):
            question = TEST_QUESTIONS[i % len(TEST_QUESTIONS)]
            start = time.time()
            success, data, elapsed = self.ai_api.chat(question)
            times.append(elapsed)
            print(f'  第{i+1}次: {elapsed:.2f}s')

        results['single_request'] = {
            'min_time': min(times),
            'max_time': max(times),
            'avg_time': sum(times) / len(times),
            'all_times': times
        }
        print(f'\n  最小: {results["single_request"]["min_time"]:.2f}s')
        print(f'  最大: {results["single_request"]["max_time"]:.2f}s')
        print(f'  平均: {results["single_request"]["avg_time"]:.2f}s')

        # 2. 并发请求测试
        print(f'\n[2/2] 并发请求测试 (并发数: {AI_TEST_CONFIG["concurrent_requests"]})...')
        questions = TEST_QUESTIONS[:AI_TEST_CONFIG['concurrent_requests']]
        
        start_time = time.time()
        batch_results = await self.ai_api.batch_chat(questions)
        total_time = time.time() - start_time

        success_count = sum(1 for r in batch_results if r['success'])
        response_times = [r['response_time'] for r in batch_results]

        results['concurrent_request'] = {
            'total_requests': len(questions),
            'success_count': success_count,
            'success_rate': success_count / len(questions) * 100,
            'total_time': total_time,
            'avg_response_time': sum(response_times) / len(response_times) if response_times else 0,
            'qps': len(questions) / total_time if total_time > 0 else 0
        }
        
        print(f'  总请求数: {results["concurrent_request"]["total_requests"]}')
        print(f'  成功数: {results["concurrent_request"]["success_count"]}')
        print(f'  成功率: {results["concurrent_request"]["success_rate"]:.1f}%')
        print(f'  总耗时: {results["concurrent_request"]["total_time"]:.2f}s')
        print(f'  QPS: {results["concurrent_request"]["qps"]:.2f}')

        self.evaluation_results['performance_test'] = results
        return results

    def run_multiround_test(self) -> Dict:
        """
        多轮对话测试
        """
        print('\n' + '=' * 50)
        print('开始多轮对话测试')
        print('=' * 50)

        history = []
        conversation = [
            ('我想买个盲盒', '第1轮'),
            ('你们有哪些分类？', '第2轮'),
            ('价格一般是多少？', '第3轮'),
            ('怎么配送？', '第4轮'),
        ]

        results = {
            'rounds': [],
            'success_rate': 0
        }

        success_count = 0
        for question, round_name in conversation:
            print(f'\n{round_name}: {question}')
            success, data, response_time = self.ai_api.chat(question, history=history)
            
            if success:
                success_count += 1
                # 添加到历史
                history.append({'role': 'user', 'content': question})
                history.append({'role': 'assistant', 'content': data.get('data', '')})
            
            round_result = {
                'round': round_name,
                'question': question,
                'success': success,
                'response_time': response_time,
                'answer': data.get('data') if data else None
            }
            results['rounds'].append(round_result)
            print(f'  结果: {"成功" if success else "失败"}, 耗时: {response_time:.2f}s')

        results['success_rate'] = success_count / len(conversation) * 100
        self.evaluation_results['multiround_test'] = results
        return results

    def generate_report(self) -> str:
        """
        生成评测报告
        """
        print('\n' + '=' * 50)
        print('生成评测报告')
        print('=' * 50)

        report = []
        report.append('=' * 80)
        report.append('校园盲盒平台 - AI服务评测报告')
        report.append('=' * 80)
        report.append(f'评测时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        report.append('')

        # 基础测试总结
        basic = self.evaluation_results.get('basic_test', {})
        if basic:
            normal = basic.get('normal_questions', [])
            normal_success = sum(1 for r in normal if r['success'])
            normal_rate = normal_success / len(normal) * 100 if normal else 0
            
            report.append('【1. 基础功能测试】')
            report.append(f'  正常问题: {len(normal)} 题, 成功率: {normal_rate:.1f}%')
            
            sensitive = basic.get('sensitive_questions', [])
            if sensitive:
                sensitive_success = sum(1 for r in sensitive if r['success'])
                report.append(f'  敏感问题: {len(sensitive)} 题, 成功率: {sensitive_success/len(sensitive)*100:.1f}%')

            edge = basic.get('edge_cases', [])
            if edge:
                edge_success = sum(1 for r in edge if r['success'])
                report.append(f'  边界情况: {len(edge)} 项, 成功率: {edge_success/len(edge)*100:.1f}%')
            report.append('')

        # 质量测试总结
        quality = self.evaluation_results.get('quality_test', [])
        if quality:
            avg_score = sum(r['score'] for r in quality) / len(quality)
            pass_count = sum(1 for r in quality if r['pass'])
            report.append('【2. 回答质量评估】')
            report.append(f'  平均得分: {avg_score:.1f}/{quality[0]["max_score"]}')
            report.append(f'  通过率: {pass_count}/{len(quality)}')
            report.append('')

        # 性能测试总结
        perf = self.evaluation_results.get('performance_test', {})
        if perf:
            single = perf.get('single_request', {})
            concurrent = perf.get('concurrent_request', {})
            
            report.append('【3. 性能测试】')
            if single:
                report.append(f'  单次请求:')
                report.append(f'    最小响应时间: {single.get("min_time", 0):.2f}s')
                report.append(f'    最大响应时间: {single.get("max_time", 0):.2f}s')
                report.append(f'    平均响应时间: {single.get("avg_time", 0):.2f}s')
            if concurrent:
                report.append(f'  并发请求 (并发数: {AI_TEST_CONFIG["concurrent_requests"]}):')
                report.append(f'    成功率: {concurrent.get("success_rate", 0):.1f}%')
                report.append(f'    总耗时: {concurrent.get("total_time", 0):.2f}s')
                report.append(f'    QPS: {concurrent.get("qps", 0):.2f}')
            report.append('')

        # 多轮测试总结
        multiround = self.evaluation_results.get('multiround_test', {})
        if multiround:
            report.append('【4. 多轮对话测试】')
            report.append(f'  对话轮数: {len(multiround.get("rounds", []))}')
            report.append(f'  成功率: {multiround.get("success_rate", 0):.1f}%')
            report.append('')

        # 总体评价
        report.append('=' * 80)
        report.append('【总体评价】')
        
        passed = True
        issues = []
        
        # 检查各项指标
        if basic:
            normal = basic.get('normal_questions', [])
            normal_rate = sum(1 for r in normal if r['success']) / len(normal) * 100 if normal else 0
            if normal_rate < 90:
                passed = False
                issues.append(f'正常问题成功率偏低: {normal_rate:.1f}%')
        
        if quality:
            avg_score = sum(r['score'] for r in quality) / len(quality)
            if avg_score < 60:
                passed = False
                issues.append(f'平均质量得分偏低: {avg_score:.1f}')
        
        if perf:
            single = perf.get('single_request', {})
            if single.get('avg_time', 999) > AI_TEST_CONFIG['max_response_time']:
                passed = False
                issues.append(f'平均响应时间超过阈值: {single.get("avg_time", 0):.2f}s')
        
        if passed:
            report.append('  ✓ AI服务整体表现良好，符合预期')
        else:
            report.append('  ✗ AI服务存在以下问题:')
            for issue in issues:
                report.append(f'    - {issue}')
        
        report.append('=' * 80)

        report_text = '\n'.join(report)
        
        # 保存到文件
        report_file = f'ai_evaluation_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        
        print(f'\n评测报告已保存到: {report_file}')
        print(report_text)
        
        return report_text

    async def run_all_tests(self) -> None:
        """
        运行所有测试
        """
        self.run_basic_test()
        self.run_quality_test()
        await self.run_performance_test()
        self.run_multiround_test()
        self.generate_report()


if __name__ == '__main__':
    evaluator = AIServiceEvaluator()
    asyncio.run(evaluator.run_all_tests())
