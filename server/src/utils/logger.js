const LEVELS = { info: 'INFO', warn: 'WARN', error: 'ERROR', debug: 'DEBUG' };

function formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

const logger = {
    info: (msg, meta) => console.log(formatMessage(LEVELS.info, msg, meta)),
    warn: (msg, meta) => console.warn(formatMessage(LEVELS.warn, msg, meta)),
    error: (msg, meta) => console.error(formatMessage(LEVELS.error, msg, meta)),
    debug: (msg, meta) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(formatMessage(LEVELS.debug, msg, meta));
        }
    },
};

module.exports = logger;
