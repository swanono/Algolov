FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm run servInst

COPY . .

EXPOSE 443

CMD ["npm", "run", "servStart"]
