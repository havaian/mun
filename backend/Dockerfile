FROM node:24-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY . .

EXPOSE 5000

# Environment variables
ENV NODE_ENV=production

# Seed runs first, then the server starts
CMD sh -c "npm run seed:superadmin && node index.js"