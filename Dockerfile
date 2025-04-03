# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy all project files
COPY . .

# Expose port 5173 (default for Vite)
EXPOSE 5173

# Start Vite development server
CMD ["npm", "run", "dev"]
