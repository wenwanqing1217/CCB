# Campus BlindBox 鈥?Instant Delivery Platform

> A campus-focused C2C & B2C blind-box trading and instant delivery system built on WeChat Mini Program and Tencent CloudBase.
> Designed for college students to trade idle items, discover surprises, and get deliveries within minutes.

<div align="center">

[![WeChat](https://img.shields.io/badge/Platform-WeChat-07C160)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![CloudBase](https://img.shields.io/badge/Backend-CloudBase-0052D9)](https://cloud.tencent.com/product/tcb)
[![Node](https://img.shields.io/badge/Node.js-16%2B-339933)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-44%20passed-brightgreen)](tests/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)
[![Code Style](https://img.shields.io/badge/Code%20Style-ESLint%2BPrettier-4B32C3)](.eslintrc.js)

</div>

---

## 馃搵 Overview

Campus BlindBox is a full-stack mini-program that combines **blind-box trading**, **real-time delivery**, and **social interaction** into one platform. It supports both peer-to-peer (C2C) idle-item trading and verified merchant storefronts (B2C), with a rider network enabling on-demand campus delivery.

| Mode | Description | Example |
|------|-------------|--------|
| **C2C** | Students sell idle items as mystery boxes | Used books, electronics, dorm essentials |
| **B2C** | Verified campus merchants operate storefronts | Tea shops, stationery stores, fruit shops |

---

## 鉁?Features

### 馃巵 Blind-Box Trading
- Publish idle items as blind boxes with titles, images, and pricing
- Category browsing, keyword search, and multi-condition filtering
- **Hybrid recommendation engine** (UCF + ICF + SVD) for personalized discovery

### 馃殮 Real-Time Delivery
- Rider grab-order mechanism with **atomic concurrency control** (prevents double-grab)
- **Route matching algorithm** 鈥?Haversine distance + greedy selection + 2-opt local search
- Real-time rider GPS tracking with estimated arrival time
- Cluster-based cold-start recommendation (DBSCAN)

### 馃挰 Community & Social
- Social feed for sharing box unboxings and campus life
- Real-time messaging / chat
- Points & love score system

### 馃 AI Assistant
- Integrated with Doubao (璞嗗寘) LLM API for intelligent Q&A
- Context-aware chat with action routing (users can jump to orders, publishing, etc.)
- Prompt template management for different scenarios (customer service, recommendation, polish)

### 馃洝锔?Admin & Operations
- Full admin dashboard with charts, delivery monitoring, rider/order management
- RBAC permission system: user / merchant / rider / admin
- Performance monitoring (FPS, memory, API latency)

---

## 馃彈锔?Architecture

```
campus-blindbox/
鈹溾攢鈹€ miniprogram/              # WeChat Mini Program frontend
鈹?  鈹溾攢鈹€ pages/                # 58 pages (index, trading, delivery, profile...)
鈹?  鈹溾攢鈹€ components/           # Reusable components (virtual-list, skeleton, lazy-image)
鈹?  鈹溾攢鈹€ custom-tab-bar/       # Custom tab bar with dark theme
鈹?  鈹斺攢鈹€ utils/                # Utilities (auth, config, cache, store, logging...)
鈹溾攢鈹€ cloudfunctions/           # Tencent CloudBase cloud functions (backend)
鈹?  鈹溾攢鈹€ boxService/           # Blind-box CRUD, listing, search
鈹?  鈹溾攢鈹€ orderService/         # Order lifecycle, status machine
鈹?  鈹溾攢鈹€ deliveryService/      # Grab-order, route matching, rider tracking
鈹?  鈹溾攢鈹€ userService/          # Login, profile, RBAC roles
鈹?  鈹溾攢鈹€ recommendationService/# Content-based + collaborative filtering
鈹?  鈹溾攢鈹€ aiService/            # LLM integration (Doubao API)
鈹?  鈹溾攢鈹€ hybridRecommendation/ # Hybrid recommendation engine
鈹?  鈹溾攢鈹€ securityService/      # Security & abuse prevention
鈹?  鈹溾攢鈹€ notificationService/  # Push notifications
鈹?  鈹溾攢鈹€ pushService/          # WebSocket / real-time push
鈹?  鈹溾攢鈹€ coinService/          # Virtual coin system
鈹?  鈹溾攢鈹€ socialService/        # Social feed & interactions
鈹?  鈹斺攢鈹€ ... (60+ functions)
鈹溾攢鈹€ services/                 # Microservice architecture (Spring Boot / Go / Python)
鈹溾攢鈹€ tests/                    # Test suite (Python pytest + Jest)
鈹溾攢鈹€ docs/                     # Design docs, API docs, interview prep
鈹斺攢鈹€ docker-compose.yml        # Local dev environment (MySQL, Redis, RocketMQ)
```

### 馃搻 Design Layers

```
鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?           WeChat Mini Program           鈹? 鈫?Frontend (WXML + WXSS + JS)
鈹溾攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?      CloudBase Cloud Functions          鈹? 鈫?Backend (Node.js 16+)
鈹溾攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?        Database & Storage               鈹? 鈫?TencentDB, Cloud Storage, Redis
鈹溾攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?      Monitoring & Observability         鈹? 鈫?Prometheus + Grafana
鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?```

---

## 馃 Core Algorithms

### 1. Hybrid Recommendation (recommendationService)

Combines **three strategies** with weighted fusion:

| Strategy | Weight | Description |
|----------|--------|-------------|
| **User-based CF (UCF)** | 0.3 | Build user-item rating matrix 鈫?cosine similarity 鈫?find similar users |
| **Item-based CF (ICF)** | 0.3 | Item feature vectors (one-hot categories, price buckets, sales, rating) 鈫?cosine similarity |
| **SVD Matrix Factorization** | 0.4 | SGD-based decomposition into k=5 latent vectors 鈫?predict ratings |

```
final_score = 0.3 脳 UCF_score + 0.3 脳 ICF_score + 0.4 脳 SVD_score
```
Complexity: O(U 脳 I) for UCF, where U = users, I = items.
Cold-start fallback: returns trending boxes for new users.

### 2. Route Matching (deliveryService)

Multi-factor dynamic scoring + greedy optimization:

```
raw_score = 0.45 脳 distance_score + 0.25 脳 time_urgency + 0.15 脳 route_quality + 0.15 脳 load_factor
```

- **distance_score**: Detour ratio via Haversine formula
- **time_urgency**: Escalates as wait time increases
- **route_quality**: Time-aware (peak 0.6 / late-night 0.95)
- **load_factor**: Rider load inversely affects willingness
- **Joint optimization**: Greedy Top-K selection 鈫?2-opt local search 鈫?random perturbation
- **Cold-start**: DBSCAN clustering by geolocation 鈫?cluster-aware recommendation

### 3. Order State Machine

```
pending 鈫?grabbed 鈫?delivering 鈫?completed
   鈫?         鈫?          鈫? cancelled  cancelled  cancelled
```
Atomic updates prevent race conditions during grab-order (see tests/test_concurrent).

---

## 馃И Testing & Quality

| Suite | Framework | Scope |
|-------|-----------|-------|
| Concurrent tests | Python pytest | Order grabbing race condition (atomicity verification) |
| API integration | Python | User, box, order, AI service flows |
| Unit tests | Jest (config ready) | Extensible for cloud functions |
| AI evaluation | Python | Response quality, multi-turn, performance benchmark |
| Linting | ESLint + Prettier | Code style enforcement via Husky pre-commit hooks |

- 50+ test cases covering core business scenarios
- Concurrent grab-order test validates anti-over-sell mechanism
- AI evaluator generates structured assessment reports

---

## 鈿?Performance Optimizations

- **Virtual list rendering** for large data sets
- **Image lazy loading** with smart preload strategy
- **Multi-tier caching** (short/long/default expiry, LRU eviction)
- **Request retry** with exponential backoff
- **Performance monitoring** (FPS, memory, API latency dashboard)

---

## 馃洜锔?Tech Stack

| Area | Technology |
|------|-----------|
| **Frontend** | WeChat Mini Program (WXML, WXSS, JavaScript ES6+) |
| **Backend** | Tencent CloudBase (60+ cloud functions, Node.js 16+) |
| **Database** | TencentDB (MongoDB-like), Redis (caching) |
| **Algorithm** | Collaborative filtering (UCF/ICF), SVD matrix factorization, Haversine, DBSCAN, 2-opt |
| **AI** | Doubao LLM API integration with prompt management |
| **DevOps** | Docker Compose, Prometheus + Grafana, Husky + lint-staged |
| **Testing** | Jest, Pytest, concurrent stress testing |

---

## 馃摝 Quick Start

### Prerequisites
- WeChat DevTools ([download](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html))
- Tencent CloudBase account (enable cloud development)
- Node.js 16+

### Setup
```bash
# 1. Clone the repo
git clone https://github.com/your-username/campus-blindbox.git
cd campus-blindbox

# 2. Install dependencies
npm install
# Also install cloud function dependencies:
# cd cloudfunctions/<function-name> && npm install

# 3. Open in WeChat DevTools
# Import the project root, configure your AppID in project.config.json

# 4. Deploy cloud functions
# Right-click cloudfunctions/ in WeChat DevTools 鈫?Upload & Deploy

# 5. (Optional) Start local dev environment
docker-compose up -d
```

---

## 馃搧 Docs

| Document | Description |
|----------|-------------|
| [Architecture Design](docs/鍒嗗眰鏋舵瀯璁捐.md) | Layered architecture & design decisions |
| [API Reference](docs/鎺ュ彛鏂囨。.md) | Complete API documentation |
| [Algorithm Details](docs/椤圭洰鎬昏.md) | Recommendation & route matching deep-dive |
| [Test Cases](docs/娴嬭瘯鐢ㄤ緥.md) | 50+ test scenarios |
| [Cache Strategy](docs/缂撳瓨灞傝璁?md) | Redis caching & LRU eviction |
| [Microservice Design](docs/鏋舵瀯鍗囩骇璁捐.md) | Migration from monolith to microservices |

---

---

## 馃鈥嶐煉?Personal Contributions

> This project demonstrates full-stack development skills with a focus on backend architecture, algorithm design, and engineering practices.

| Area | Contributions |
|------|--------------|
| **Backend Architecture** | Designed 54 cloud functions with layered architecture (controller -> service -> data access). Implemented centralized error handling system with 7-module error codes. |
| **Recommendation Engine** | Built hybrid recommendation system combining UCF (cosine similarity), ICF, and SVD matrix factorization with weighted fusion (0.3/0.3/0.4). |
| **Concurrency Control** | Implemented atomic order-grabbing using `where + update` pattern to prevent overselling. Validated with 100-rider concurrent stress test. |
| **Route Optimization** | Developed multi-factor delivery matching: Haversine distance + greedy Top-K + 2-opt local search + DBSCAN cold-start clustering. |
| **AI Integration** | Integrated Doubao LLM API with context-aware chat, prompt template management, and action routing. |
| **DevOps** | Docker Compose local dev environment (MySQL, Redis, RocketMQ), Prometheus monitoring, GitHub Actions CI/CD pipeline. |
| **Testing** | 44+ Jest unit tests + Python integration tests covering algorithms, error handling, concurrent scenarios. |

---

## 馃幆 Technical Challenges & Solutions

### Challenge 1: Preventing Order Overselling During Peak Hours
**Problem**: Multiple riders could grab the same order simultaneously, causing overselling.
**Solution**: Used Tencent CloudBase's atomic document update with conditional `where({status: 'pending'})`. Only the first rider whose update succeeds gets the order. Validated through 100-rider concurrent simulation.
**Key code**: `cloudfunctions/grabOrder/index.js`

### Challenge 2: Cold-Start Recommendation for New Users
**Problem**: New users have no interaction history, making collaborative filtering ineffective.
**Solution**: Implemented DBSCAN clustering for rider cold-start (by geolocation) and trending-box fallback for user cold-start. Hybrid approach ensures every user gets recommendations from day one.

### Challenge 3: Real-Time Rider-Order Matching at Scale
**Problem**: Scoring all rider-order pairs is O(R*O), impractical with many riders.
**Solution**: Greedy Top-K selection reduces candidates, then 2-opt local search refines the match. Haversine distance + time urgency + route quality + load factor scoring.

### Challenge 4: Migrating from Monolith to Microservices
**Problem**: Initial cloud function architecture was monolithic and hard to maintain.
**Solution**: Designed 6 microservices (user, box, order, delivery, recommendation, message) with Docker Compose, RocketMQ for async communication, ShardingSphere for data sharding. See [Microservice Design](docs/鏋舵瀯鍗囩骇璁捐.md).

---

## 馃搳 Project Stats

| Metric | Value |
|--------|-------|
| Pages | 58 mini-program pages |
| Cloud Functions | 54 backend functions |
| Test Cases | 44+ unit tests + integration tests |
| Documentation | 21 design documents |
| Git Commits | 10+ structured commits |
| Algorithms | Collaborative filtering, SVD, DBSCAN, 2-opt, Haversine |
| Services | 6 microservices (Spring Boot / Go / Python) |

## 馃搫 License

MIT License 鈥?feel free to use, modify, and share.

---

*Built with 鉂わ笍 for campus communities.*

