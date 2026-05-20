FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/fastid-front/browser /usr/share/nginx/html
COPY public/assets/env.template.js /usr/share/nginx/html/assets/env.template.js
COPY docker/entrypoint.sh /entrypoint.sh
# Strip Windows CRLF so exec does not fail with "no such file or directory"
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
