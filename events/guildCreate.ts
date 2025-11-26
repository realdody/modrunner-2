import { Guild } from 'discord.js';
import { Guilds } from '../database/db';
import logger from '../logger';
import { Event } from '../types';

const event: Event = {
    name: 'guildCreate',
    async execute(guild: Guild) {
        logger.info(`Client was invited to guild ${guild.name} (${guild.id}).`);

        // Add settings to database for guild
        await Guilds.create({
            id: guild.id,
        });
        logger.info(`Initialized settings for guild ${guild.name} (${guild.id})`);
    },
};

export default event;
