# Use Node.js 20 base image
FROM node:20

# Install Google Chrome stable and its dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y \
    google-chrome-stable \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (ensure puppeteer downloads its own chrome if needed, or uses system)
RUN npm install

# Copy app source
COPY . .

# Hugging Face Spaces default port
ENV PORT=7860
EXPOSE 7860

# Puppeteer environment variables
# Tell Puppeteer to use the installed Google Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Hugging Face requires a non-root user (id 1000)
RUN useradd -m -u 1000 user
RUN chown -R user:user /app
USER user

# Command to run the application
CMD ["node", "src/index.js"]
