FROM node:22

WORKDIR /app

COPY backend .

RUN npm install && npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000

CMD ["npm", "start"]