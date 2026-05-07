FROM node:22

WORKDIR /app

COPY . .

RUN npm install && npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000

CMD ["npm", "start"]
