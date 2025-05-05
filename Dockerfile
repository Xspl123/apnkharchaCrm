# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose development port
EXPOSE 5173

# Start Vite development server
<<<<<<< HEAD
CMD ["npm", "run", "dev", "--", "--host"]
=======
CMD ["npm", "run", "dev"]
>>>>>>> f81c650 (Initial commit)
