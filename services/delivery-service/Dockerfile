# ==========================================
# delivery-service Dockerfile (Go)
# ==========================================
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖
RUN apk add --no-cache git

# 复制源代码
COPY . .

# 下载依赖
RUN go mod tidy

# 构建
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o delivery-service .

# 运行阶段
FROM alpine:latest

WORKDIR /app

# 安装curl（健康检查用）
RUN apk --no-cache add curl ca-certificates

# 复制二进制文件
COPY --from=builder /app/delivery-service .

EXPOSE 8004

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8004/health || exit 1

ENTRYPOINT ["./delivery-service"]
