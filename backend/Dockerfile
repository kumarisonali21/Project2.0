FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000

CMD ["npm", "start"]
