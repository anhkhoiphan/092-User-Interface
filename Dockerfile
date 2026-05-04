# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Inject API URL lúc build (Vite bakes env vào JS bundle)
# Override bằng Build variables trong HF Space Settings nếu cần
ARG VITE_API_URL=https://anhkhoiphan-092-ui-core.hf.space/api
ARG VITE_SOCKET_URL=https://anhkhoiphan-092-ui-core.hf.space

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# HF Spaces yêu cầu port 7860
EXPOSE 7860

CMD ["nginx", "-g", "daemon off;"]
