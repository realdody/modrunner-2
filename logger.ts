import pino from 'pino';

const targets: pino.TransportTargetOptions[] = [
    {
        target: 'pino-pretty',
        options: {
            ignore: 'pid,hostname',
            translateTime: 'SYS:yyyy-mm-dd hh:MM:s:l TT',
        },
    },
];

if (process.env.NODE_ENV === 'production') {
    targets.push({
        target: '@logtail/pino',
        options: { sourceToken: process.env.BETTERSTACK_SOURCE_TOKEN },
    });
}

const logger = pino({
    level: process.env.LOGGING_LEVEL ?? 'info',
    transport: {
        targets: targets,
    },
});

export default logger;
