FROM node:19-alpine

WORKDIR /home/app

COPY ./build ./
COPY package*.json ./
RUN npm i

CMD ["node", "/home/app/server.js"]