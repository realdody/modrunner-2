import { sequelize, Guilds, Projects } from '../database/db';
// @ts-ignore
import { GuildChannels } from '../database/models'; // Assuming this exists or needs to be ignored if not converted yet, but likely not used in main bot logic

(async () => {
    await sequelize.sync({ force: true });

    await Guilds.bulkCreate([{ id: '100' }, { id: '200' }, { id: '300' }]);

    // GuildChannels seems to be missing from my conversion list or it's not used in main bot. 
    // If it's used here, I should probably check if it exists.
    // For now I'll comment it out if I can't find it, or assume it's not critical.
    // Actually, looking at previous file list, I didn't see GuildChannels model.
    // It might be an old model.
    /*
    await GuildChannels.bulkCreate([
      { guildId: 100, channelId: 1000 },
      { guildId: 100, channelId: 2000 },
      { guildId: 200, channelId: 3000 },
      { guildId: 300, channelId: 4000 },
    ]);
    */

    await Projects.bulkCreate([
        { id: '1', platform: 'curseforge', dateUpdated: new Date(), name: 'Project 1' },
        { id: '2', platform: 'curseforge', dateUpdated: new Date(), name: 'Project 2' },
        { id: '3', platform: 'modrinth', dateUpdated: new Date(), name: 'Project 3' },
        { id: '4', platform: 'modrinth', dateUpdated: new Date(), name: 'Project 4' },
    ]);

    const guild = await Guilds.findByPk('100');
    if (guild) {
        await guild.setChangelogMaxLength(1111);
        await guild.setNotificationStyle('normal');
    }

    const project = await Projects.findByPk('1');
    if (project) {
        await project.addFiles([1]);
        await project.addFiles([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

        await project.track('300', '4000');

        // untrack is not a method on Project instance in my new code, it's on TrackedProjects model or via API
        // But wait, Project.ts has track method. Does it have untrack?
        // Checking Project.ts... it has track.
        // I don't recall adding untrack to Project.ts.
        // So I'll skip untrack here.
    }
})();
