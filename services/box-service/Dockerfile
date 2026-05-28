# ==========================================
# box-service Dockerfile
# ==========================================
FROM maven:3.9-openjdk-17 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests

FROM openjdk:17-slim

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8002/actuator/health || exit 1

EXPOSE 8002

ENTRYPOINT ["java", "-jar", "app.jar"]
