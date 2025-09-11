FROM node:20.18

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

# Expose API port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production

# Use entrypoint script
ENTRYPOINT ["./entrypoint.sh"]