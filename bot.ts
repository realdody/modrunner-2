import fs from 'node:fs';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import logger from './logger';
import path from 'node:path';

// Extend the Client type to include commands
declare module 'discord.js' {
    interface Client {
        commands: Collection<string, any>;
    }
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
// Check if directory exists before reading
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = require(filePath);
        // Handle both default export and module.exports
        const cmd = command.default || command;
        if ('data' in cmd && 'execute' in cmd) {
            client.commands.set(cmd.data.name, cmd);
        } else {
            logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const event = require(filePath);
        const evt = event.default || event;
        if (evt.once) {
            client.once(evt.name, (...args) => evt.execute(...args));
        } else {
            client.on(evt.name, (...args) => evt.execute(...args));
        }
    }
}

client.login(process.env.DISCORD_TOKEN).then(() => {
    logger.info(`Logged into Discord as ${client.user?.tag}`);
});
