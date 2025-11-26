import { Request, Response, NextFunction } from 'express';
import { PermissionsBitField, Client } from 'discord.js';

const middleware = async (request: Request, response: Response, next: NextFunction) => {
    if (!request.body.guildId || !request.body.userId) {
        return response.status(400).json({
            error: 'A guild and/or user ID was not provided with this request',
        });
    }

    const client = request.app.locals.client as Client;
    const guild = client.guilds.cache.get(request.body.guildId);
    if (!guild) return response.status(404).json({ error: 'Guild not found' });

    try {
        const member = await guild.members.fetch(request.body.userId);
        if (!member) return response.status(404).json({ error: 'Member not found' });

        if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return response.status(401).json({
                error: 'You are not authorized to use this route',
            });
        }
        next();
    } catch (error) {
        return response.status(404).json({ error: 'Member not found or other error' });
    }
};

export default middleware;
