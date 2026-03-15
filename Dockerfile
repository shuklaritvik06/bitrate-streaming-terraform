FROM node:20-alpine AS builder
RUN apk update && apk add --no-cache aws-cli
RUN npm install -g pnpm@10.25.0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG SECRETS
ENV SECRETS=${SECRETS}
RUN pnpm run build:docker

FROM node:20-alpine
RUN apk update && apk add --no-cache aws-cli
RUN npm install -g pnpm@10.25.0
WORKDIR /app
COPY --from=builder /app /app
ARG SECRETS
ENV SECRETS=${SECRETS}
EXPOSE 3000
CMD ["pnpm", "run", "start:docker"]