FROM node:20-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
COPY shared/package*.json shared/

RUN npm install

COPY . .

ARG VITE_SERVER_URL=http://localhost:4000
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

RUN npm run build --workspace @prompt-night/shared
RUN npm run build --workspace client

FROM nginx:1.27-alpine AS runner

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

