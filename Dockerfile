# 1. Base com dependências
FROM node:20-alpine AS base
WORKDIR /app

# Copia arquivos de dependência
COPY package.json package-lock.json* ./

# Instala dependências com cache otimizado
RUN npm ci

# 2. Builder (compila a aplicação)
FROM base AS builder
WORKDIR /app

COPY . .
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 3. Runner (produção)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Cria usuário menos privilegiado
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia artefatos standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public || true

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
