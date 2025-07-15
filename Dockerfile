# 1. Etapa de dependências (base)
FROM node:20-alpine AS base
WORKDIR /app

# Copia apenas arquivos de dependência
COPY package.json package-lock.json* ./

# Instala dependências em ambiente limpo
RUN npm ci

# 2. Etapa de build
FROM base AS builder
WORKDIR /app

# Copia o restante do código-fonte
COPY . .

# Desativa telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Executa o build
RUN npm run build

# 3. Etapa final: produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copia arquivos necessários da build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia pasta public (opcional)
RUN mkdir -p ./public
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Usa o usuário com permissão restrita
USER nextjs

# Expõe porta padrão do Next.js
EXPOSE 3000

# Comando para rodar o app em produção
CMD ["node", "server.js"]
