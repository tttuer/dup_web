FROM node:23-alpine

WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 4173

CMD ["pnpm", "start"]
