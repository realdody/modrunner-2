import express, { Request, Response } from 'express';
import { Client } from 'discord.js';

const router = express.Router();

router.route('/:id').get(async (request: Request, response: Response) => {
    const client = request.app.locals.client as Client;
    const channel = client.channels.cache.get(request.params.id);
    if (channel) {
        response.status(200).json(channel);
    } else {
        response.status(404).end();
    }
});

export default router;
