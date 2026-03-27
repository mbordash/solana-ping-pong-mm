# Use Node.js LTS as the base image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Start the bot
CMD [ "npm", "start" ]
