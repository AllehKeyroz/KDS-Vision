# Dockerfile

# 1. Estágio de Dependências
FROM node:20-alpine AS deps
WORKDIR /app

# Copia package.json e lockfile
COPY package.json package-lock.json* ./
# Instala as dependências
RUN npm install

# 2. Estágio de Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copia as dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
# Copia o restante do código da aplicação
COPY . .

# Builda a aplicação
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Estágio de Produção (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Cria grupo e usuário para rodar a aplicação com menos privilégios
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os artefatos da build do estágio anterior
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# Copia o diretório public apenas se ele existir
COPY --from=builder --chown=nextjs:nodejs /app/public ./public || true

# Define o proprietário dos arquivos para o usuário 'nextjs'
RUN chown -R nextjs:nodejs ./.next
RUN chown -R nextjs:nodejs ./public || true


# Define o usuário para rodar a aplicação
USER nextjs

EXPOSE 3000

# Define o comando para iniciar a aplicação
CMD ["npm", "start", "-p", "3000"]
