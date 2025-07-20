# 1. Etapa base: instalação de dependências
FROM node:20-alpine AS base
WORKDIR /app

# Copia arquivos de dependência
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm ci

# 2. Etapa de build
FROM base AS builder
WORKDIR /app

# Copia o restante do código-fonte
COPY . .

# Garante que a pasta public exista (evita erro no COPY)
RUN mkdir -p /app/public

# Desativa telemetria e faz o build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Etapa de produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Cria usuário com menos privilégios
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copia artefatos da build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Usa usuário seguro
USER nextjs

EXPOSE 3000

# Inicia o servidor Next.js standalone
CMD ["node", "server.js"]
