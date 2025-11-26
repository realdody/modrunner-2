import readline from 'node:readline';
import { Guilds } from '../database/db';

(async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    try {
        rl.question('Enter guild ID: ', async (id) => {
            const guild = await Guilds.findByPk(id);
            if (guild) {
                rl.question('Enter new max: ', async (max) => {
                    await guild.update({ maxProjects: parseInt(max) });
                    console.log(`Set guild's max tracked projects to ${max}.`);
                    rl.close();
                });
            } else {
                console.log('Guild not found');
                rl.close();
            }
        });
    } catch (error) {
        console.error(error);
    }
})();
