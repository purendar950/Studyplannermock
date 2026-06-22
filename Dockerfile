# Universal container image — deploy to any container host
# (Render, Railway, Fly.io, Cloud Run, a VPS, etc.)
FROM node:22-alpine

WORKDIR /app

# Install backend dependencies first (better layer caching)
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy the rest of the app (frontend + server)
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/server.js"]
