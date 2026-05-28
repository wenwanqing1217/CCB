
import json
import redis
import random
from flask import Flask, request, jsonify
from collections import defaultdict

app = Flask(__name__)

# 初始化 Redis
r = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)

# 模拟数据（生产环境从数据库或缓存加载）
BOXES = {
    "box_001": {
        "id": "box_001",
        "title": "精美文具套装",
        "category": "stationery",
        "tags": ["文具", "学习", "办公用品"],
        "price": 29.9,
        "sellerId": "user_001"
    },
    "box_002": {
        "id": "box_002",
        "title": "零食大礼包",
        "category": "snack",
        "tags": ["零食", "美食", "休闲"],
        "price": 49.9,
        "sellerId": "user_002"
    },
    "box_003": {
        "id": "box_003",
        "title": "二手书籍",
        "category": "book",
        "tags": ["书籍", "学习", "二手"],
        "price": 19.9,
        "sellerId": "user_003"
    },
    "box_004": {
        "id": "box_004",
        "title": "数码配件",
        "category": "digital",
        "tags": ["数码", "配件", "手机"],
        "price": 79.9,
        "sellerId": "user_004"
    },
    "box_005": {
        "id": "box_005",
        "title": "生活日用品",
        "category": "daily",
        "tags": ["日用品", "生活", "居家"],
        "price": 15.9,
        "sellerId": "user_005"
    },
    "box_006": {
        "id": "box_006",
        "title": "运动装备",
        "category": "sports",
        "tags": ["运动", "健身", "户外"],
        "price": 89.9,
        "sellerId": "user_006"
    }
}

# 用户行为模拟
USER_ACTIONS = defaultdict(list)


@app.route("/api/recommendation", methods=["GET"])
def get_recommendation():
    """
    获取混合推荐结果
    """
    user_id = request.args.get("userId", "user_001")
    limit = int(request.args.get("limit", 10))

    # 尝试从缓存获取
    cache_key = f"recommendation:user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        app.logger.info(f"从缓存获取推荐: {user_id}")
        return jsonify({"success": True, "data": json.loads(cached), "fromCache": True})

    # 1. 内容推荐 (60%)
    content_rec = content_based_recommendation(user_id, limit=10)
    
    # 2. 协同过滤推荐 (40%)
    collab_rec = collaborative_filtering_recommendation(user_id, limit=10)
    
    # 3. 混合推荐
    mixed_rec = mixed_recommendation(content_rec, collab_rec, limit=limit)
    
    # 写入缓存
    r.setex(cache_key, 300, json.dumps(mixed_rec))
    app.logger.info(f"生成推荐并缓存: {user_id}")
    
    return jsonify({"success": True, "data": mixed_rec, "fromCache": False})


def content_based_recommendation(user_id, limit=10):
    """
    内容推荐：根据用户历史行为，推荐相似商品
    """
    # 获取用户历史
    user_actions = USER_ACTIONS.get(user_id, [])
    
    # 统计用户兴趣标签
    tag_count = defaultdict(int)
    for action in user_actions:
        box_id = action.get("boxId")
        if box_id in BOXES:
            for tag in BOXES[box_id]["tags"]:
                tag_count[tag] += 1
    
    # 如果没有历史，返回热门
    if not tag_count:
        return hot_recommendation(limit)
    
    # 计算每个商品的匹配度
    scores = {}
    for box_id, box in BOXES.items():
        score = 0
        for tag in box["tags"]:
            score += tag_count.get(tag, 0) * 10
        scores[box_id] = score
    
    # 排序
    sorted_boxes = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [BOXES[bid] for bid, _ in sorted_boxes[:limit]]


def collaborative_filtering_recommendation(user_id, limit=10):
    """
    协同过滤：基于用户的协同过滤
    """
    # 模拟用户-商品矩阵
    user_item_matrix = {
        "user_001": {"box_001": 5, "box_002": 4, "box_003": 3},
        "user_002": {"box_001": 4, "box_002": 5, "box_004": 5},
        "user_003": {"box_003": 5, "box_005": 4, "box_006": 3},
        "user_004": {"box_004": 5, "box_006": 4},
    }
    
    if user_id not in user_item_matrix:
        return hot_recommendation(limit)
    
    # 找到相似用户
    similar_users = []
    for uid, items in user_item_matrix.items():
        if uid == user_id:
            continue
        sim = calculate_similarity(user_item_matrix[user_id], items)
        similar_users.append((uid, sim))
    
    # 按相似度排序
    similar_users.sort(key=lambda x: x[1], reverse=True)
    
    # 从相似用户中收集推荐
    recommended = set()
    result = []
    for uid, sim in similar_users[:3]:
        for box_id in user_item_matrix[uid]:
            if box_id not in user_item_matrix[user_id] and box_id not in recommended:
                recommended.add(box_id)
                result.append(BOXES.get(box_id))
                if len(result) >= limit:
                    return result
    
    # 补充热门
    result += hot_recommendation(limit - len(result))
    return result[:limit]


def calculate_similarity(user1_items, user2_items):
    """
    计算用户相似度（Jaccard）
    """
    set1 = set(user1_items.keys())
    set2 = set(user2_items.keys())
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    return intersection / union if union != 0 else 0


def mixed_recommendation(content_rec, collab_rec, limit=10):
    """
    混合推荐：60% 内容 + 40% 协同
    """
    content_size = int(limit * 0.6)
    collab_size = int(limit * 0.4)
    
    # 去重
    content_ids = {item["id"] for item in content_rec[:content_size]}
    collab_filtered = [item for item in collab_rec if item["id"] not in content_ids][:collab_size]
    
    result = content_rec[:content_size] + collab_filtered
    
    # 打乱顺序
    random.shuffle(result)
    
    return result


def hot_recommendation(limit=10):
    """
    热门推荐（冷启动用）
    """
    # 模拟热门商品（随机选）
    hot = list(BOXES.values())
    random.shuffle(hot)
    return hot[:limit]


@app.route("/api/user-action", methods=["POST"])
def record_user_action():
    """
    记录用户行为
    """
    data = request.json
    user_id = data.get("userId")
    action = data.get("action")  # view, buy
    box_id = data.get("boxId")
    
    USER_ACTIONS[user_id].append({
        "userId": user_id,
        "action": action,
        "boxId": box_id,
        "timestamp": __import__("time").time()
    })
    
    # 清除该用户的推荐缓存
    cache_key = f"recommendation:user:{user_id}"
    r.delete(cache_key)
    
    app.logger.info(f"记录用户行为: {user_id} {action} {box_id}")
    
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8005, debug=True)

