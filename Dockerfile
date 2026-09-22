# SkillBridge API image
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY server/ ./
EXPOSE 5000
CMD ["node", "server.js"]
