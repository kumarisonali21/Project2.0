FROM node:22

WORKDIR /app

COPY backend .

RUN npm install

EXPOSE 5000

CMD ["npm", "start"]