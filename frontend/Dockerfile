FROM node:20-slim

WORKDIR /workspace

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Bind host so Vite is accessible outside the Docker container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
