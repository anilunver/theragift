# TheraGift Backend — Production Dockerfile (Render için)
#
# Multi-stage build: Maven ile derleme + hafif JRE runtime image.
# Bu dosya sadece build/deploy amaçlıdır, hiçbir iş mantığı içermez.

# ---- Stage 1: Build ----
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Önce sadece pom.xml kopyalanır ki bağımlılıklar layer cache'den yararlansın
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Kaynak kodu kopyala ve paketle (testler atlanır)
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:17-jre AS runtime

WORKDIR /app

# Build stage'den üretilen jar'ı sabit isimle kopyala
COPY --from=build /app/target/theragift-backend.jar /app/app.jar

# Render, servise dinamik bir PORT env değişkeni enjekte eder (SERVER_PORT
# değil). application.yml'i değiştirmeden Render uyumluluğu sağlamak için:
# ENTRYPOINT çalışırken önce PORT, o da yoksa SERVER_PORT, o da yoksa 8080
# kullanılır. Böylece application.yml'deki "server.port: ${SERVER_PORT:8080}"
# davranışı (lokal/Docker Compose gibi diğer ortamlarda) hiç bozulmaz.
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -jar /app/app.jar --server.port=${PORT:-${SERVER_PORT:-8080}}"]
