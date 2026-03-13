FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Vite default port
EXPOSE 5173

# Expose host to allow connections from outside the container
CMD ["npm", "run", "dev", "--", "--host"]
