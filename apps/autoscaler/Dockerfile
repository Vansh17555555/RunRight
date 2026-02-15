FROM node:18-alpine

# Install Docker CLI to scale services
RUN apk add --no-cache docker-cli

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

CMD ["node", "index.js"]
