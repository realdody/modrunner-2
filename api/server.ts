import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import https from 'https';
import logger from '../logger';
// @ts-ignore
import { version } from '../package.json';
// @ts-ignore
import channelsRoute from './routes/channels';
// @ts-ignore
import guildsRoute from './routes/guilds';
// @ts-ignore
import projectsRoute from './routes/projects';
// @ts-ignore
import statsRoute from './routes/stats';
import { Client } from 'discord.js';

const app = express();

app.use(express.json());

app.use((request: Request, response: Response, next: NextFunction) => {
    const xApiKey = request.get('x-api-key');
    if (!xApiKey || xApiKey !== process.env.MODRUNNER_API_KEY) {
        logger.warn(`Rejected an unauthorized request from ${request.hostname} (${request.ip}) at route ${request.method} ${request.originalUrl}`);
        return response.status(401).end();
    }

    logger.debug(`Recieved a request from ${request.hostname} (${request.ip}), at route ${request.method} ${request.originalUrl}`);

    next();
});

app.use('/channels', channelsRoute);
app.use('/guilds', guildsRoute);
app.use('/projects', projectsRoute);
app.use('/stats', statsRoute);

app.get('/', (request: Request, response: Response) => {
    response.status(200).json({
        about: 'Welcome Traveller!',
        name: 'modrunner-api',
        version: version,
    });
});

export function startServer(client: Client) {
    app.locals.client = client;

    let server;
    if (process.env.NODE_ENV !== 'production') {
        server = http.createServer(app);
    } else {
        server = https.createServer(
            {
                key: fs.readFileSync(process.env.HTTPS_KEY_PATH!),
                cert: fs.readFileSync(process.env.HTTPS_CERT_PATH!),
            },
            app
        );
    }

    server.listen(process.env.SERVER_PORT, () => logger.info(`Web server is listening on port ${process.env.SERVER_PORT}`));
}
