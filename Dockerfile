# Estágio de Dependências
FROM node:20-alpine AS deps
WORKDIR /app

# Copia os arquivos de manifesto de pacotes e instala as dependências
COPY package.json package-lock.json* ./
RUN npm install

# Estágio de Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copia as dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Constrói o aplicativo Next.js
RUN npm run build

# Estágio de Produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Cria um usuário e grupo para rodar o app com menos privilégios
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos de build do estágio anterior
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Define o proprietário dos arquivos para o novo usuário
USER nextjs

# Expõe a porta que o app vai rodar
EXPOSE 3000

# Comando para iniciar o servidor Next.js em produção
CMD ["npm", "start"]
