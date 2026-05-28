FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p /home/kki/logs

USER node

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "server.js"]
