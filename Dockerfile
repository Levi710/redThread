# Stage 1: Build the Client
FROM node:20 AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Final Production Environment
FROM node:20
WORKDIR /app

# Install Google Chrome for Puppeteer inside Docker
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y \
    google-chrome-stable \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy Server files
COPY server/package*.json ./
RUN npm install
COPY server/ .

# Copy Client build (the server expects it at ../client/out relative to server/src/index.js)
COPY --from=client-builder /client/out /client/out

# Environment
ENV PORT=7860
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE 7860

# Hugging Face Spaces runs as UID 1000. The 'node' image already has a 'node' user with this ID.
RUN chown -R node:node /app /client
USER node

# Run the server
CMD ["node", "src/index.js"]
