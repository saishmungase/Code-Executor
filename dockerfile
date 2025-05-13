# ---------------------------------------------------
# Use official Node.js image as the base
# This image has Node, npm, and basic tools preinstalled
# ---------------------------------------------------
FROM node:18

# ---------------------------------------------------
# Update the system and install required compilers:
# - Python3 for .py files
# - OpenJDK 17 for Java (.java files)
# - Rust compiler (rustc) for .rs files
# ---------------------------------------------------
RUN apt-get update && \
    apt-get install -y \
    python3 \
    openjdk-17-jdk \
    rustc && \
    npm install -g typescript && \
    apt-get clean

# ---------------------------------------------------
# Set the working directory inside the container
# All paths will be relative to this from now on
# ---------------------------------------------------
WORKDIR /app

# ---------------------------------------------------
# Copy package.json and package-lock.json
# Install only production dependencies
# ---------------------------------------------------
COPY package*.json ./
RUN npm install

# ---------------------------------------------------
# Copy the rest of the application source code
# ---------------------------------------------------
COPY . .

# ---------------------------------------------------
# Create the directory for storing temporary code files
# ---------------------------------------------------
RUN mkdir -p codeFiles

# ---------------------------------------------------
# Expose the port that your Express server listens on
# Render will map this to a public URL
# ---------------------------------------------------
EXPOSE 3000

# ---------------------------------------------------
# Run the Node.js application directly using node index.js
# instead of npm start (in case package.json is problematic)
# ---------------------------------------------------
CMD ["node", "index.js"]