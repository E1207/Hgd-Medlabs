# Stage 1: Build with Maven and Java 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime with Java 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Créer les répertoires nécessaires pour le FileWatcher
RUN mkdir -p /app/data/incoming /app/data/processed /app/data/error /app/logs

# Copier le JAR
COPY --from=build /app/target/*.jar app.jar

# Variables d'environnement par défaut
ENV JAVA_OPTS="-Xms256m -Xmx512m" \
    SPRING_PROFILES_ACTIVE=prod \
    TZ=Africa/Douala

EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
