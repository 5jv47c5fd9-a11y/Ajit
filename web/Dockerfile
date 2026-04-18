FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json next.config.mjs ./
RUN npm install
COPY app ./app
COPY components ./components
COPY lib ./lib
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
