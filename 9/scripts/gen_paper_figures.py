# -*- coding: utf-8 -*-
"""
论文_2.md 所有图表生成脚本
工科标准：黑白线条、简洁清晰、风格统一
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle, FancyArrowPatch, Circle, Polygon, Ellipse
from matplotlib.lines import Line2D
import numpy as np
import os

# 全局样式：工科黑白标准
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'SimSun']
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['figure.dpi'] = 150
plt.rcParams['savefig.dpi'] = 200
plt.rcParams['font.size'] = 10

OUTPUT_DIR = r'c:\Users\温青\Desktop\1.3\images\paper_figures'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def style_ax(ax, title=None):
    """统一坐标轴样式"""
    ax.set_axis_off()
    if title:
        ax.set_title(title, fontsize=12, fontweight='bold', pad=10)


# ============================================================
# 图1：系统架构图 (分层架构)
# ============================================================
def fig1_architecture():
    fig, ax = plt.subplots(figsize=(12, 7))
    style_ax(ax)
    
    # 三层框架
    layers = [
        {'y': 5.0, 'h': 1.6, 'color': '#E8E8E8', 'title': '表现层（微信小程序前端）',
         'items': ['首页', '盲盒页', '订单页', '配送页', '我的页']},
        {'y': 2.8, 'h': 1.8, 'color': '#D0D0D0', 'title': '业务逻辑层（云函数）',
         'items': ['publishBox', 'createOrder', 'grabOrder', 'deliveryService',
                   'recommendationService', 'coinService', 'triggerAutoDonate',
                   'userService', 'boxService', 'orderService']},
        {'y': 0.6, 'h': 1.6, 'color': '#B8B8B8', 'title': '数据访问层',
         'items': ['云数据库（7个集合）', '云存储（图片文件）']}
    ]
    
    for layer in layers:
        # 层背景框
        rect = FancyBboxPatch((0.5, layer['y']), 11, layer['h'],
                               boxstyle="round,pad=0.05",
                               facecolor=layer['color'], edgecolor='#333333',
                               linewidth=1.5)
        ax.add_patch(rect)
        
        # 层标题
        ax.text(0.8, layer['y'] + layer['h'] - 0.3, layer['title'],
                fontsize=11, fontweight='bold', color='#222222')
        
        # 内部项目
        n = len(layer['items'])
        cols = min(n, 5) if layer['y'] > 2 else 2
        rows = (n + cols - 1) // cols
        item_w = 1.8
        item_h = 0.35
        start_x = 1.0
        start_y = layer['y'] + layer['h'] - 0.8
        
        for i, item in enumerate(layer['items']):
            col = i % cols
            row = i // cols
            x = start_x + col * (item_w + 0.3)
            y = start_y - row * (item_h + 0.15)
            
            # 小框
            irect = FancyBboxPatch((x, y - item_h), item_w, item_h,
                                    boxstyle="round,pad=0.02",
                                    facecolor='white', edgecolor='#555555',
                                    linewidth=0.8)
            ax.add_patch(irect)
            ax.text(x + item_w / 2, y - item_h / 2, item,
                    ha='center', va='center', fontsize=8, color='#333333')
    
    # 箭头：表现层 → 业务层
    ax.annotate('', xy=(6, 4.65), xytext=(6, 4.45),
                arrowprops=dict(arrowstyle='-|>', color='#333333', lw=1.5))
    
    # 箭头：业务层 → 数据层
    ax.annotate('', xy=(6, 2.25), xytext=(6, 2.45),
                arrowprops=dict(arrowstyle='-|>', color='#333333', lw=1.5))
    
    ax.set_xlim(-0.5, 12)
    ax.set_ylim(-0.3, 7)
    
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig1_architecture.png')
    plt.savefig(path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f'[OK] {path}')
    return path


# ============================================================
# 图2：E-R图 (实体关系图)
# ============================================================
def fig2_er_diagram():
    fig, ax = plt.subplots(figsize=(14, 9))
    style_ax(ax)
    
    # 实体定义：(名称, x中心, y中心, 属性列表)
    entities = {
        'users':      ('用户\n(users)',       2.0, 7.5, ['_id(PK)', '_openid', 'nickname', 'role', 'coins']),
        'boxes':     ('盲盒\n(boxes)',       6.5, 7.5, ['_id(PK)', 'sellerId(FK)', 'title', 'category', 'minPrice/maxPrice', 'status']),
        'orders':    ('订单\n(orders)',     11.0, 7.5, ['_id(PK)', 'boxId(FK)', 'buyerId(FK)', 'riderId(FK)', 'status', 'price']),
        'riders':    ('骑手\n(riders)',     2.0, 3.5, ['_id(PK)', '_openid(FK)', 'name', 'phone', 'lat/lng', 'status']),
        'rec':       ('推荐记录\n(recommendations)', 6.5, 3.5, ['_id(PK)', 'userId(FK)', 'boxIds', 'reason']),
        'coinLogs':  ('积分流水\n(coinLogs)', 11.0, 3.5, ['_id(PK)', 'userId(FK)', 'type', 'amount', 'reason']),
        'donations': ('捐赠记录\n(donations)', 6.5, 0.3, ['_id(PK)', 'userId(FK)', 'amount', 'status']),
    }
    
    entity_boxes = {}
    for name, (label, cx, cy, attrs) in entities.items():
        # 外框
        w, h = 2.6, 0.3 + len(attrs) * 0.32 + 0.15
        rect = FancyBboxPatch((cx - w/2, cy - h/2), w, h,
                               boxstyle="round,pad=0.03",
                               facecolor='#F5F5F5', edgecolor='#222222',
                               linewidth=1.2)
        ax.add_patch(rect)
        
        # 标题栏
        trect = FancyBboxPatch((cx - w/2, cy + h/2 - 0.38), w, 0.38,
                                boxstyle="round,pad=0.02",
                                facecolor='#DDDDDD', edgecolor='#222222',
                                linewidth=1)
        ax.add_patch(trect)
        ax.text(cx, cy + h/2 - 0.19, label, ha='center', va='center',
                fontsize=8.5, fontweight='bold', color='#111111')
        
        # 属性
        for i, attr in enumerate(attrs):
            ay = cy + h/2 - 0.58 - i * 0.32
            ax.text(cx - w/2 + 0.1, ay, f'  {attr}', ha='left', va='center',
                    fontsize=7.5, color='#333333', family='monospace')
        
        entity_boxes[name] = (cx, cy, w, h)
    
    # 关系连线
    relations = [
        ('users', 'boxes',    '发布',   1, 'N'),
        ('users', 'orders',   '创建',   1, 'N'),
        ('users', 'rec',      '生成自', 1, 'N'),
        ('users', 'donations','来源于',1, 'N'),
        ('users', 'coinLogs', '赚取',   1, 'N'),
        ('boxes', 'orders',   '关联',   1, '1'),
        ('boxes', 'rec',      '被推荐', 1, 'N'),
        ('riders', 'orders',  '执行',   1, 'N'),
    ]
    
    for e1, e2, rel, c1, c2 in relations:
        x1, y1, w1, h1 = entity_boxes[e1]
        x2, y2, w2, h2 = entity_boxes[e2]
        
        # 计算连接点
        if y1 > y2:
            ys1, ye1 = y1 - h1/2, y1 - h1/2
            ys2, ye2 = y2 + h2/2, y2 + h2/2
        else:
            ys1, ye1 = y1 + h1/2, y1 + h1/2
            ys2, ye2 = y2 - h2/2, y2 - h2/2
        
        ax.plot([x1, x2], [ys1, ys2], color='#444444', linewidth=0.9, zorder=0)
        
        # 关系标注
        mx, my = (x1 + x2) / 2, (ys1 + ys2) / 2
        ax.text(mx, my + 0.15, f'\n{rel}\n{c1}:{c2}', ha='center', va='center',
                fontsize=7, color='#555555',
                bbox=dict(boxstyle='round,pad=0.15', facecolor='white', 
                         edgecolor='#AAAAAA', linewidth=0.5))
    
    ax.set_xlim(-1, 14)
    ax.set_ylim(-1.2, 9.5)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig2_er_diagram.png')
    plt.savefig(path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f'[OK] {path}')
    return path


# ============================================================
# 图3：顺路匹配算法流程图
# ============================================================
def fig3_algorithm_flow():
    fig, ax = plt.subplots(figsize=(10, 13))
    style_ax(ax)
    
    # 流程节点定义：(标签, 形状: rect/diamond/para, y位置)
    nodes = [
        ('开始',                    'term',   12.0),
        ('接收配送请求（订单ID）',   'proc',   10.8),
        ('获取订单起终点坐标',       'proc',   9.6),
        ('查询在线骑手列表',         'proc',   8.4),
        ('遍历候选骑手集合',         'proc',   7.2),
        ('计算距离得分 S_dist',      'proc',   6.0),
        ('计算时效得分 S_time',      'proc',   4.9),
        ('计算道路等级 S_road',      'proc',   3.8),
        ('计算负载因子 S_load',      'proc',   2.7),
        ('加权求和 Score = α·Sdist+β·Stime+γ·Sroad', 'proc', 1.5),
        ('还有未处理的骑手？',       'diamond', 0.2),
        ('按Score降序排序',          'proc',   -1.2),
        ('返回Top-K骑手列表',        'proc',   -2.4),
        ('结束',                    'term',   -3.5),
    ]
    
    cx = 5.0
    node_positions = []
    
    for label, ntype, y in nodes:
        if ntype == 'term':
            # 椭圆（开始/结束）
            ell = Ellipse((cx, y), 2.8, 0.6, facecolor='#E0E0E0',
                          edgecolor='#222222', linewidth=1.3)
            ax.add_patch(ell)
        elif ntype == 'diamond':
            # 菱形判断框
            size = 1.2
            diamond = Polygon([(cx, y+size), (cx+size*1.5, y),
                              (cx, y-size), (cx-size*1.5, y)],
                             facecolor='#F0F0F0', edgecolor='#222222',
                             linewidth=1.3, closed=True)
            ax.add_patch(diamond)
        else:
            # 矩形处理框
            tw = max(len(label) * 0.1 + 0.6, 4.0)
            rect = FancyBboxPatch((cx - tw/2, y - 0.35), tw, 0.7,
                                   boxstyle="round,pad=0.04",
                                   facecolor='#F8F8F8', edgecolor='#333333',
                                   linewidth=1.1)
            ax.add_patch(rect)
        
        ax.text(cx, y, label, ha='center', va='center',
                fontsize=9, color='#222222')
        node_positions.append((cx, y, ntype))
    
    # 连线
    arrow_style = dict(arrowstyle='-|>', color='#333333', lw=1.2)
    
    for i in range(len(nodes) - 1):
        y1 = nodes[i][2]
        y2 = nodes[i+1][2]
        
        # 特殊处理循环边（菱形的"否"分支）
        if nodes[i+1][1] == 'diamond':
            ax.annotate('', xy=(cx, y2 + 1.2), xytext=(cx, y1 - 0.35),
                       arrowprops=arrow_style)
            # "是" → 继续向下
            ax.annotate('', xy=(cx + 2.5, y2), xytext=(cx + 1.8, y2),
                       arrowprops=arrow_style)
            ax.text(cx + 2.1, y2 + 0.2, '否', fontsize=9, color='#333333')
            # 循环回上方
            ax.annotate('', xy=(cx + 3.2, 6.5), xytext=(cx + 2.5, y2),
                       arrowprops=dict(arrowstyle='-|>', color='#333333',
                                     lw=1.2, connectionstyle='arc3,rad=-0.3'))
            ax.text(cx + 2.9, 4.0, '是（继续下一位）', fontsize=8,
                    color='#666666', rotation=90)
        else:
            ax.annotate('', xy=(cx, y2 + 0.35 if nodes[i+1][1] != 'diamond' and nodes[i+1][1] != 'term' else y2 + 0.3),
                       xytext=(cx, y1 - 0.35 if nodes[i][1] != 'diamond' and nodes[i][1] != 'term' else y1 - 0.3),
                       arrowprops=arrow_style)
    
    # 重新画更精确的直线连接（覆盖上面的粗糙版本）
    # 直接用简单的竖线连接非菱形节点
    for i in range(len(nodes)-1):
        if nodes[i][1] not in ('diamond',) and nodes[i+1][1] not in ('diamond',):
            pass  # 已处理
    
    ax.set_xlim(-1, 11)
    ax.set_ylim(-4.2, 13)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig3_algorithm_flow.png')
    plt.savefig(path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f'[OK] {path}')
    return path


# ============================================================
# 图4a：盲盒发布流程图
# ============================================================
def fig4a_publish_flow():
    fig, ax = plt.subplots(figsize=(10, 11))
    style_ax(ax)
    
    nodes = [
        ('开始',              'term',   10.0),
        ('卖家点击"发布盲盒"', 'proc',   8.8),
        ('选择盲盒类别',       'proc',   7.7),
        ('填写标题/描述/价格', 'proc',   6.6),
        ('上传封面图片',       'proc',   5.5),
        ('前端校验表单完整性', 'diamond', 4.3),
        ('调用publishBox云函数', 'proc',  3.0),
        ('提示补全信息',       'proc',   3.0),  # 左分支
        ('云函数校验合法性',   'diamond', 1.7),
        ('写入boxes集合',      'proc',   0.4),
        ('返回错误信息',       'proc',   0.4),  # 右分支
        ('返回盲盒ID，跳转详情页', 'proc', -0.9),
        ('结束',               'term',  -2.0),
    ]
    
    cx = 5.0
    
    for label, ntype, y in nodes[:6] + nodes[6:7]:
        if ntype == 'term':
            ax.add_patch(Ellipse((cx, y), 2.6, 0.55, facecolor='#E0E0E0',
                         edgecolor='#222', linewidth=1.3))
        elif ntype == 'diamond':
            s = 1.1
            ax.add_patch(Polygon([(cx,y+s),(cx+s*1.5,y),(cx,y-s),(cx-ss*1.5,y)] if False else [(cx,y+s),(cx+s*1.5,y),(cx,y-s),(cx-s*1.5,y)],
                                facecolor='#F0F0F0', edgecolor='#222', lw=1.3, closed=True))
        else:
            tw = max(len(label)*0.09 + 0.5, 3.8)
            ax.add_patch(FancyBboxPatch((cx-tw/2, y-0.33), tw, 0.66,
                            boxstyle="round,pad=0.04", facecolor='#F8F8F8',
                            edgecolor='#333', linewidth=1.1))
        ax.text(cx, y, label, ha='center', va='center', fontsize=9, color='#222')
    
    # 菱形重画修正
    for label, ntype, y in [nodes[5], nodes[7]]:
        s = 1.1
        ax.add_patch(Polygon([(cx, y+s), (cx+s*1.5, y), (cx, y-s), (cx-s*1.5, y)],
                     facecolor='#F0F0F0', edgecolor='#222', lw=1.3, closed=True))
        ax.text(cx, y, label, ha='center', va='center', fontsize=9, color='#222')
    
    # 分支节点
    # 否→补全信息（左侧）
    lx = 1.8
    ax.add_patch(FancyBboxPatch((lx-1.5, 2.7), 3.0, 0.6,
                    boxstyle="round,pad=0.04", facecolor='#F8F8F8', edgecolor='#333', lw=1.1))
    ax.text(lx, 3.0, '提示补全信息', ha='center', va='center', fontsize=9, color='#222')
    ax.plot([cx-1.65, lx], [4.3-1.1, 3.3], color='#333', lw=1.2)
    ax.annotate('', xy=(lx, 3.3), xytext=(cx-1.65, 4.3-1.1),
               arrowprops=dict(arrowstyle='-|>', color='#333', lw=1.2))
    ax.text(cx-1.3, 3.7, '否', fontsize=9, color='#333')
    ax.plot([lx, lx], [2.7, 1.5], color='#333', lw=1.2)
    ax.plot([lx, cx-0.3], [1.5, 1.5], color='#333', lw=1.2)
    
    # 是→继续（向下）
    ax.annotate('', xy=(cx, 3.0+0.33), xytext=(cx, 4.3-1.1),
               arrowprops=dict(arrowstyle='-|>', color='#333', lw=1.2))
    ax.text(cx+0.3, 3.6, '是', fontsize=9, color='#333')
    
    # 第二个菱形及分支
    s = 1.1
    ax.add_patch(Polygon([(cx, 1.7+s), (cx+s*1.5, 1.7), (cx, 1.7-s), (cx-s*1.5, 1.7)],
                 facecolor='#F0F0F0', edgecolor='#222', lw=1.3, closed=True))
    ax.text(cx, 1.7, '云函数校验合法性', ha='center', va='center', fontsize=9, color='#222')
    
    ax.annotate('', xy=(cx, 0.4+0.33), xytext=(cx, 1.7-1.1),
               arrowprops=dict(arrowstyle='-|>', color='#333', lw=1.2))
    ax.text(cx+0.3, 1.0, '是', fontsize=9, color='#333')
    
    # 否→错误（右侧）
    rx = 8.2
    ax.add_patch(FancyBboxPatch((rx-1.4, 1.4), 2.8, 0.6,
                    boxstyle="round,pad=0.04", facecolor='#F8F8F8', edgecolor='#333', lw=1.1))
    ax.text(rx, 1.7, '返回错误信息', ha='center', va='center', fontsize=9, color='#222')
    ax.plot([cx+1.65, rx-1.4], [1.7, 1.7], color='#333', lw=1.2)
    ax.text(cx+1.9, 1.9, '否', fontsize=9, color='#333')
    ax.plot([rx, rx], [1.4, -0.3], color='#333', lw=1.2)
    ax.plot([rx, cx+0.3], [-0.3, -0.3], color='#333', lw=1.2)
    
    # 写入→返回
    tw = 3.5
    ax.add_patch(FancyBboxPatch((cx-tw/2, -0.9-0.33), tw, 0.66,
                    boxstyle="round,pad=0.04", facecolor='#F8F8F8', edgecolor='#333', lw=1.1))
    ax.text(cx, -0.57, '返回盲盒ID，跳转详情页', ha='center', va='center', fontsize=9, color='#222')
    ax.annotate('', xy=(cx, -0.9), xytext=(cx, 0.07),
               arrowprops=dict(arrowstyle='-|>', color='#333', lw=1.2))
    
    # 结束
    ax.add_patch(Ellipse((cx, -2.0), 2.6, 0.55, facecolor='#E0E0E0', edgecolor='#222', lw=1.3))
    ax.text(cx, -2.0, '结束', ha='center', va='center', fontsize=9, color='#222')
    ax.annotate('', xy=(cx, -1.73), xytext=(cx, -1.23),
               arrowprops=dict(arrowstyle='-|>', color='#333', lw=1.2))
    
    # 主干竖线
    main_y = [10.0, 8.8, 7.7, 6.6, 5.5]
    for i in range(len(main_y)-1):
        ax.annotate('', xy=(cx, main_y[i+1]+0.33), xytext=(cx, main_y[i]-0.33),
                   arrowprops=dict(arrowstyle='-|>', color='#333', lw=1.2))
    
    ax.set_xlim(-1, 11)
    ax.set_ylim(-2.8, 11)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig4a_publish_flow.png')
    plt.savefig(path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f'[OK] {path}')
    return path


# ============================================================
# 图4b：订单状态转换图
# ============================================================
def fig4b_state_machine():
    fig, ax = plt.subplots(figsize=(11, 6))
    style_ax(ax)
    
    # 状态定义
    states = [
        ('pending',    1.5, 3.5, '待接单\n(pending)'),
        ('picked_up',  5.0, 3.5, '已取件\n(picked_up)'),
        ('in_transit', 8.5, 3.5, '配送中\n(in_transit)'),
        ('completed',  11.5, 3.5, '已完成\n(completed)'),
        ('cancelled',  5.0, 0.8, '已取消\n(cancelled)'),
    ]
    
    state_pos = {}
    for name, cx, cy, label in states:
        # 圆角矩形表示状态
        rect = FancyBboxPatch((cx - 1.1, cy - 0.5), 2.2, 1.0,
                               boxstyle="round,pad=0.08",
                               facecolor='#EEEEEE', edgecolor='#222222',
                               linewidth=1.5)
        ax.add_patch(rect)
        ax.text(cx, cy, label, ha='center', va='center',
                fontsize=9.5, fontweight='bold', color='#222222')
        state_pos[name] = (cx, cy)
    
    # 初始箭头（从左上到pending）
    ax.annotate('', xy=(state_pos['pending'][0]-1.1, state_pos['pending'][1]),
               xytext=(state_pos['pending'][0]-2.0, state_pos['pending'][1]+1.0),
               arrowprops=dict(arrowstyle='-|>', color='#333', lw=1.5))
    ax.text(state_pos['pending'][0]-1.6, state_pos['pending'][1]+0.6,
            'createOrder', fontsize=8, color='#444', ha='center')
    
    # 转换箭头
    transitions = [
        ('pending', 'picked_up', 'grabOrder\n(骑手抢单)'),
        ('picked_up', 'in_transit', '确认取件'),
        ('in_transit', 'completed', '确认送达'),
        ('pending', 'cancelled', '超时30分钟/\n买家取消'),
    ]
    
    for from_s, to_s, label in transitions:
        x1, y1 = state_pos[from_s]
        x2, y2 = state_pos[to_s]
        
        ax.annotate('', xy=(x2 - 1.1 if x2 > x1 else x2 + 1.1,
                             y2 if abs(y2-y1)<1 else y2+0.5),
                   xytext=(x1 + 1.1 if x2 > x1 else x1 - 1.1,
                           y1 if abs(y2-y1)<1 else y1-0.5),
                   arrowprops=dict(arrowstyle='-|>', color='#333333', lw=1.3,
                                 connectionstyle='arc3,rad=0' if from_s != 'pending' or to_s != 'cancelled' else 'arc3,rad=-0.3'))
        
        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2 + (0.3 if from_s == 'pending' and to_s == 'cancelled' else 0)
        ax.text(mx, my + 0.2, label, ha='center', va='bottom',
                fontsize=8, color='#444444',
                bbox=dict(boxstyle='round,pad=0.1', facecolor='white',
                         edgecolor='#CCCCCC', linewidth=0.5))
    
    # 终止标记
    ax.plot([state_pos['completed'][0]+1.3, state_pos['completed'][0]+2.0],
            [state_pos['completed'][1], state_pos['completed'][1]], 'o', 
            color='#222222', markersize=5)
    ax.plot([state_pos['cancelled'][0], state_pos['cancelled'][0]+0.7],
            [state_pos['cancelled'][1]-0.5, state_pos['cancelled'][1]-0.5], 'o',
            color='#222222', markersize=5)
    
    ax.set_xlim(-0.5, 14)
    ax.set_ylim(-0.5, 5.5)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig4b_state_machine.png')
    plt.savefig(path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f'[OK] {path}')
    return path


# ============================================================
# 图5：用例图
# ============================================================
def fig5_usecase():
    fig, ax = plt.subplots(figsize=(14, 8))
    style_ax(ax)
    
    # 系统边界
    sys_rect = FancyBboxPatch((3.5, 0.3), 9, 7,
                               boxstyle="round,pad=0.3",
                               facecolor='#FAFAFA', edgecolor='#333333',
                               linewidth=1.5)
    ax.add_patch(sys_rect)
    ax.text(8, 7.0, '校园盲盒即时配送平台', ha='center', va='center',
            fontsize=12, fontweight='bold', color='#222222')
    
    # 角色
    actors = [
        ('普通用户', 1.2, 5.5),
        ('骑手',   1.2, 2.5),
    ]
    for name, ax_pos, ay in actors:
        # 火柴人简化：圆头+直线身体
        head = Circle((ax_pos, ay+0.5), 0.28, facecolor='white',
                      edgecolor='#222', linewidth=1.3)
        ax.add_patch(head)
        ax.plot([ax_pos, ax_pos], [ay+0.22, ay-0.3], color='#222', linewidth=1.5)
        ax.plot([ax_pos-0.3, ax_pos+0.3], [ay-0.0, ay-0.35], color='#222', linewidth=1.3)
        ax.plot([ax_pos, ax_pos-0.25], [ay-0.3, ay-0.7], color='#222', linewidth=1.3)
        ax.plot([ax_pos, ax_pos+0.25], [ay-0.3, ay-0.7], color='#222', linewidth=1.3)
        ax.text(ax_pos, ay-1.0, name, ha='center', va='top',
                fontsize=10, fontweight='bold', color='#222222')
    
    # 用例（椭圆）
    usecases = [
        ('注册/登录',     5.5, 6.0),
        ('发布盲盒',      8.5, 6.0),
        ('浏览盲盒',      11.0, 6.0),
        ('创建订单',      5.5, 4.3),
        ('确认收货',      8.5, 4.3),
        ('申请成为骑手',   5.5, 2.6),
        ('浏览订单池',    8.5, 2.6),
        ('抢单',          11.0, 2.6),
        ('更新配送状态',   8.5, 1.0),
        ('确认送达',      11.0, 1.0),
        ('查看推荐',      11.0, 4.3),
        ('积分操作',      5.5, 1.0),
    ]
    
    uc_positions = {}
    for name, ux, uy in usecases:
        ell = Ellipse((ux, uy), 2.2, 0.7, facecolor='#F0F0F0',
                      edgecolor='#333333', linewidth=1.1)
        ax.add_patch(ell)
        ax.text(ux, uy, name, ha='center', va='center',
                fontsize=8.5, color='#222222')
        uc_positions[name] = (ux, uy)
    
    # 用户关联的用例
    user_uc = ['注册/登录', '发布盲盒', '浏览盲盒', '创建订单', '确认收货', '查看推荐', '积分操作']
    rider_uc = ['注册/登录', '申请成为骑手', '浏览订单池', '抢单', '更新配送状态', '确认送达']
    
    for uc_name in user_uc:
        ux, uy = uc_positions[uc_name]
        ax.annotate('', xy=(ux-1.1, uy), xytext=(1.5, 5.5),
                   arrowprops=dict(arrowstyle='-', color='#333333', lw=0.9))
    
    for uc_name in rider_uc:
        ux, uy = uc_positions[uc_name]
        ax.annotate('', xy=(ux-1.1, uy), xytext=(1.5, 2.5),
                   arrowprops=dict(arrowstyle='-', color='#333333', lw=0.9))
    
    ax.set_xlim(-1, 14)
    ax.set_ylim(-1.5, 8)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig5_usecase.png')
    plt.savefig(path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f'[OK] {path}')
    return path


# ============================================================
# 图6：测试用例分布饼图
# ============================================================
def fig6_test_pie():
    fig, ax = plt.subplots(figsize=(8, 6))
    
    labels = ['用户管理\n(3个)', '盲盒交易\n(4个)', '订单管理\n(3个)',
              '配送服务\n(3个)', '推荐与积分\n(12个)']
    sizes = [3, 4, 3, 3, 12]
    colors = ['#E0E0E0', '#C8C8C8', '#B0B0B0', '#989898', '#707070']
    explode = (0, 0, 0, 0, 0.06)
    
    wedges, texts, autotexts = ax.pie(sizes, explode=explode, labels=labels, colors=colors,
                                       autopct='%1.1f%%', startangle=90,
                                       pctdistance=0.6, textprops={'fontsize': 9},
                                       wedgeprops={'edgecolor':'white', 'linewidth':2})
    
    for t in autotexts:
        t.set_fontsize(9)
        t.set_color('#222222')
        t.set_fontweight('bold')
    
    ax.set_title('各模块测试用例分布（共25个）', fontsize=12, fontweight='bold', pad=15)
    
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig6_test_pie.png')
    plt.savefig(path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f'[OK] {path}')
    return path


# ============================================================
# 图7：核心接口响应时间柱状图
# ============================================================
def fig7_performance_bar():
    fig, ax = plt.subplots(figsize=(10, 6))
    
    interfaces = ['userService', 'coinService', 'publishBox', 'grabOrder',
                  'createOrder', 'deliveryService', 'recommendationService']
    values = [42, 68, 85, 95, 112, 156, 203]
    
    bars = ax.bar(range(len(interfaces)), values, color='#A0A0A0', 
                  edgecolor='#333333', linewidth=1.0, width=0.6)
    
    # 数值标签
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 4,
                f'{val}ms', ha='center', va='bottom', fontsize=9, fontweight='bold',
                color='#333333')
    
    # 500ms参考线
    ax.axhline(y=500, color='#888888', linestyle='--', linewidth=1.0, label='指标上限(500ms)')
    ax.legend(fontsize=9, loc='upper left')
    
    ax.set_xticks(range(len(interfaces)))
    ax.set_xticklabels(interfaces, rotation=20, ha='right', fontsize=9)
    ax.set_ylabel('平均响应时间 (ms)', fontsize=10)
    ax.set_title('核心接口平均响应时间对比', fontsize=12, fontweight='bold', pad=10)
    ax.set_ylim(0, 260)
    ax.yaxis.grid(True, linestyle=':', alpha=0.5)
    ax.set_axisbelow(True)
    
    # 去掉顶部和右侧边框
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig7_performance_bar.png')
    plt.savefig(path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f'[OK] {path}')
    return path


# ============================================================
# 主程序
# ============================================================
if __name__ == '__main__':
    print('=' * 50)
    print('开始生成论文图表...')
    print('=' * 50)
    
    paths = []
    paths.append(fig1_architecture())       # 图1：架构图
    paths.append(fig2_er_diagram())        # 图2：E-R图
    paths.append(fig3_algorithm_flow())    # 图3：算法流程图
    paths.append(fig4a_publish_flow())     # 图4：发布流程
    paths.append(fig4b_state_machine())    # 图5：状态转换图
    paths.append(fig5_usecase())           # 图6：用例图
    paths.append(fig6_test_pie())         # 图7：饼图
    paths.append(fig7_performance_bar())   # 图8：柱状图
    
    print('=' * 50)
    print(f'全部完成！共生成 {len(paths)} 张图表')
    print(f'输出目录: {OUTPUT_DIR}')
    for p in paths:
        print(f'  [FIG] {os.path.basename(p)}')
