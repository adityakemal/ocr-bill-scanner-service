FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install

COPY src ./src

ENV PORT=3001

EXPOSE 3001

CMD ["bun", "src/index.ts"]