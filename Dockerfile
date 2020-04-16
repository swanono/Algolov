FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm run servAutoinstall

COPY . .

EXPOSE 443

CMD ["npm", "run", "servStart"]
