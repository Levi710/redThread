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

# Copy Client build (the server expects it at ../client/dist relative to server/src/index.js)
# In this single container setup at /app, it will be at /app/../client/dist ??
# Let's adjust server's clientPath logic slightly or copy it to /client/dist
COPY --from=client-builder /client/dist /client/dist

# Environment
ENV PORT=7860
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE 7860

# Hugging Face Spaces non-root user (id 1000)
RUN useradd -m -u 1000 user
RUN chown -R user:user /app /client
USER user

# Run the server
CMD ["node", "src/index.js"]
