# All-in-one: Angular (nginx :80) + Spring BFF (:8080) in a single container.
# Build: docker build -t olegsirik/fastid:latest .
# Run:   docker run -p 8082:80 --env-file .env olegsirik/fastid:latest

FROM node:20-alpine AS front-build
WORKDIR /app
COPY FastIdFront/package*.json ./
RUN npm ci
COPY FastIdFront/ ./
RUN npm run build

FROM gradle:8.7-jdk21 AS api-build
WORKDIR /app
COPY FastIdAPI/gradle/ gradle/
COPY FastIdAPI/settings.gradle.kts FastIdAPI/build.gradle.kts ./
RUN gradle dependencies --no-daemon || true
COPY FastIdAPI/src/ src/
RUN gradle bootJar -x test --no-daemon

FROM amazoncorretto:21-alpine
WORKDIR /app

RUN apk add --no-cache nginx curl \
    && mkdir -p /run/nginx /var/log/nginx /usr/share/nginx/html/assets

COPY --from=api-build /app/build/libs/fastid-api.jar /app/app.jar
COPY --from=front-build /app/dist/fastid-front/browser /usr/share/nginx/html
COPY FastIdFront/public/assets/env.template.js /usr/share/nginx/html/assets/env.template.js
COPY docker/nginx-all-in-one.conf /etc/nginx/http.d/default.conf
COPY docker/entrypoint-all-in-one.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://127.0.0.1:8080/actuator/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
