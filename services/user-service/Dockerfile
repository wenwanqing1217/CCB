# ==========================================
# user-service Dockerfile
# ==========================================
FROM maven:3.9-openjdk-17 AS builder

WORKDIR /app

# 复制pom.xml
COPY pom.xml .

# 下载依赖
RUN mvn dependency:go-offline -B

# 复制源代码
COPY src ./src

# 构建
RUN mvn package -DskipTests

# 运行阶段
FROM openjdk:17-slim

WORKDIR /app

# 复制jar包
COPY --from=builder /app/target/*.jar app.jar

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8001/actuator/health || exit 1

EXPOSE 8001

ENTRYPOINT ["java", "-jar", "app.jar"]
