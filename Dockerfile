FROM oven/bun:1

# Install dependencies for native modules (sqlite3)
RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Start the bot
CMD ["bun", "run", "start"]
