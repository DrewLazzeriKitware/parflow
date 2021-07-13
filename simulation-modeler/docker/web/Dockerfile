FROM node
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm i
COPY . .
RUN npm run build
