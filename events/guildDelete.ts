import { Guild } from 'discord.js';
import logger from '../logger';
import { TrackedProjects, Guilds } from '../database/db';
import { Event } from '../types';

const event: Event = {
    name: 'guildDelete',
    async execute(guild: Guild) {
        // Remove this guild's settings from the database
        await Guilds.destroy({
            where: {
                id: guild.id,
            },
        });

        // Remove this guild's tracked projects
        const untrackedProjects = await TrackedProjects.destroy({
            where: {
                guildId: guild.id,
            },
        });

        logger.info(`Client left guild ${guild.name} (${guild.id}). Removed settings and removed ${untrackedProjects} projects from tracking.`);
    },
};

export default event;
