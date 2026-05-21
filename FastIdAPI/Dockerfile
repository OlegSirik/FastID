FROM gradle:8.7-jdk21 AS build
WORKDIR /app
COPY gradle/ gradle/
COPY settings.gradle.kts build.gradle.kts ./
RUN gradle dependencies --no-daemon || true
COPY src/ src/
RUN gradle bootJar -x test --no-daemon

FROM amazoncorretto:21-alpine
WORKDIR /app
RUN apk add --no-cache curl \
    && addgroup -S spring && adduser -S spring -G spring
USER spring
COPY --from=build /app/build/libs/fastid-api.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
