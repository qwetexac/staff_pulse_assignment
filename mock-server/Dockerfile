# syntax=docker/dockerfile:1

FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY mock-server ./mock-server

ENV HOST=0.0.0.0
ENV PORT=4000
EXPOSE 4000

CMD ["node", "--experimental-strip-types", "mock-server/index.ts"]
