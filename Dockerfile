# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --foreground-scripts --loglevel=notice

COPY . .

ARG VITE_API_URL=http://localhost:8080/api/v1
ARG VITE_USE_MOCK=true
ARG VITE_GEMINI_API_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
