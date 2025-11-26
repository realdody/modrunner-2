import fs from 'node:fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import logger from '../logger';
import { Command } from '../types';

const commands: any[] = [];
const user_commands: any[] = [];
const message_commands: any[] = [];

const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.ts'));

(async () => {
    for (const file of commandFiles) {
        const commandModule = await import(`../commands/${file}`);
        const command: Command = commandModule.default;
        commands.push(command.data.toJSON());
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    try {
        logger.info('Registering application commands...');

        if (process.argv.includes('--global') || process.argv.includes('-g')) {


            logger.info('Registering application commands globally across Discord...');
            await rest.put(Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID!), { body: commands });
        } else {
            logger.info('Registering application commands to development guild...');
            if (!process.env.DISCORD_DEVELOPMENT_GUILD_ID) {
                logger.info('There is no defined development guild; cancelling registration.');
                process.exit(0);
            }
            await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID!, process.env.DISCORD_DEVELOPMENT_GUILD_ID), { body: commands });
        }

        logger.info(`Registered ${commands.length} CHAT_INPUT, ${user_commands.length} USER, and ${message_commands.length} MESSAGE commands.`);
    } catch (error) {
        logger.warn('An error occurred while registering application commands.');
        logger.error(error);
    }
})();
