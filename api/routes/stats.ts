import express, { Request, Response } from 'express';
import { Projects } from '../../database/db';
import logger from '../../logger';
import { Client } from 'discord.js';

const router = express.Router();

router.get('/', async (request: Request, response: Response) => {
    const projectCount = await Projects.count();
    const client = request.app.locals.client as Client;

    if (process.env.BETTERSTACK_STATUS_PAGE_ID && process.env.BETTERSTACK_RESOURCE_ID) {
        const uptimeData = await fetch(
            `https://uptime.betterstack.com/api/v2/status-pages/${process.env.BETTERSTACK_STATUS_PAGE_ID}/resources/${process.env.BETTERSTACK_RESOURCE_ID}`,
            {
                headers: {
                    authorization: `Bearer ${process.env.BETTERSTACK_API_KEY}`,
                },
            }
        )
            .then((res) => res.json())
            .catch((error) => logger.error(error));

        return response.status(200).json({
            servers: client.guilds.cache.size,
            projects: projectCount,
            uptime: uptimeData?.data?.attributes?.availability ?? 0.0,
        });
    } else {
        return response.status(200).json({
            servers: client.guilds.cache.size,
            projects: projectCount,
            uptime: 0.0,
        });
    }
});

export default router;
