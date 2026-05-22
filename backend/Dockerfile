FROM node:20.19.0

WORKDIR /app

COPY package*.json ./
RUN npm ci
RUN npm install -g nodemon

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["nodemon", "src/server.js"]