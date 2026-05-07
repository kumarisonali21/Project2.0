FROM node:22

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend .
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000

CMD ["npm", "start"]