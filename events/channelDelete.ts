import { GuildChannel } from 'discord.js';
import { TrackedProjects } from '../database/db';
import logger from '../logger';
import { Event } from '../types';

const event: Event = {
    name: 'channelDelete',
    async execute(channel: GuildChannel) {
        const deleted = await TrackedProjects.destroy({
            where: {
                guildId: channel.guild.id,
                channelId: channel.id,
            },
        });

        logger.info(
            `Channel #${channel.name} (${channel.id}) was deleted in guild ${channel.guild.name} (${channel.guild.id}). Removed ${deleted} projects from tracking as a result.`
        );
    },
};

export default event;
