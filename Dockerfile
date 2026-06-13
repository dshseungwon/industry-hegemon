# 단일 컨테이너: 클라이언트(dist) 빌드 + 권위서버(WebSocket /ws) 한 프로세스로 서빙.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV PORT=8787
EXPOSE 8787
CMD ["npm", "start"]
