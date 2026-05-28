package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()
var rdb *redis.Client

// RiderLocation 骑手位置
type RiderLocation struct {
	RiderID  string  `json:"riderId"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
}

// NearbyOrder 附近订单
type NearbyOrder struct {
	OrderID   string  `json:"orderId"`
	FromDorm  string  `json:"fromDorm"`
	ToDorm    string  `json:"toDorm"`
	Lat       float64 `json:"lat"`
	Lng       float64 `json:"lng"`
	Distance  float64 `json:"distance"` // 米
}

func main() {
	// 初始化 Redis
	rdb = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       1,
	})

	// 测试连接
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatal("Redis 连接失败:", err)
	}
	log.Println("Redis 连接成功")

	// 初始化 Gin
	r := gin.Default()

	// 骑手更新位置
	r.POST("/api/rider/:riderId/location", updateRiderLocation)

	// 查询附近骑手
	r.GET("/api/nearby-riders", getNearbyRiders)

	// 发布附近订单
	r.POST("/api/nearby-orders", publishNearbyOrder)

	// 查询附近订单
	r.GET("/api/nearby-orders", getNearbyOrders)

	log.Println("Delivery Service 启动成功，端口: 8004")
	if err := r.Run(":8004"); err != nil {
		log.Fatal("启动失败:", err)
	}
}

// 更新骑手位置
func updateRiderLocation(c *gin.Context) {
	riderID := c.Param("riderId")

	var loc RiderLocation
	if err := c.ShouldBindJSON(&loc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}
	loc.RiderID = riderID

	// 更新 Redis Geo
	key := "delivery:rider:location"
	_, err := rdb.GeoAdd(ctx, key, &redis.GeoLocation{
		Name:      riderID,
		Longitude: loc.Lng,
		Latitude:  loc.Lat,
	}).Result()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// 设置过期时间（5秒）
	rdb.Expire(ctx, key, 5*time.Second)

	// 保存骑手详情
	detailKey := "delivery:rider:detail:" + riderID
	detailData, _ := json.Marshal(loc)
	rdb.Set(ctx, detailKey, detailData, 30*time.Minute)

	log.Printf("骑手 %s 位置更新: (%.6f, %.6f)", riderID, loc.Lat, loc.Lng)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    loc,
	})
}

// 查询附近骑手
func getNearbyRiders(c *gin.Context) {
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lng, _ := strconv.ParseFloat(c.Query("lng"), 64)
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "1000"), 64) // 默认 1000 米

	key := "delivery:rider:location"

	// 查询附近骑手
	locations, err := rdb.GeoRadius(ctx, key, lng, lat, &redis.GeoRadiusQuery{
		Radius:      radius,
		Unit:        "m",
		WithCoord:   true,
		WithDist:    true,
		Sort:        "ASC",
		Count:       50,
	}).Result()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// 构造结果
	var riders []map[string]interface{}
	for _, loc := range locations {
		riderID := loc.Name
		detailKey := "delivery:rider:detail:" + riderID
		detailStr, _ := rdb.Get(ctx, detailKey).Result()

		var riderDetail map[string]interface{}
		if detailStr != "" {
			json.Unmarshal([]byte(detailStr), &riderDetail)
		}

		riders = append(riders, map[string]interface{}{
			"riderId":  riderID,
			"lat":      loc.Latitude,
			"lng":      loc.Longitude,
			"distance": loc.Dist,
			"detail":   riderDetail,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    riders,
	})
}

// 发布附近订单
func publishNearbyOrder(c *gin.Context) {
	var order NearbyOrder
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// 更新 Redis Geo
	key := "delivery:order:location"
	_, err := rdb.GeoAdd(ctx, key, &redis.GeoLocation{
		Name:      order.OrderID,
		Longitude: order.Lng,
		Latitude:  order.Lat,
	}).Result()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// 设置过期时间（30分钟）
	rdb.Expire(ctx, key, 30*time.Minute)

	// 保存订单详情
	detailKey := "delivery:order:detail:" + order.OrderID
	detailData, _ := json.Marshal(order)
	rdb.Set(ctx, detailKey, detailData, 30*time.Minute)

	log.Printf("附近订单发布: %s", order.OrderID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    order,
	})
}

// 查询附近订单
func getNearbyOrders(c *gin.Context) {
	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lng, _ := strconv.ParseFloat(c.Query("lng"), 64)
	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "2000"), 64) // 默认 2000 米

	key := "delivery:order:location"

	// 查询附近订单
	locations, err := rdb.GeoRadius(ctx, key, lng, lat, &redis.GeoRadiusQuery{
		Radius:      radius,
		Unit:        "m",
		WithCoord:   true,
		WithDist:    true,
		Sort:        "ASC",
		Count:       50,
	}).Result()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// 构造结果
	var orders []map[string]interface{}
	for _, loc := range locations {
		orderID := loc.Name
		detailKey := "delivery:order:detail:" + orderID
		detailStr, _ := rdb.Get(ctx, detailKey).Result()

		var orderDetail NearbyOrder
		if detailStr != "" {
			json.Unmarshal([]byte(detailStr), &orderDetail)
		}

		orders = append(orders, map[string]interface{}{
			"orderId":    orderID,
			"lat":        loc.Latitude,
			"lng":        loc.Longitude,
			"distance":   loc.Dist,
			"fromDorm":   orderDetail.FromDorm,
			"toDorm":     orderDetail.ToDorm,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orders,
	})
}
