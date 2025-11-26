import { TrackedProjects } from '../database/db';

modifyFiles();
async function modifyFiles() {
    const projects = await TrackedProjects.findAll();

    for (const project of projects) {
        // latest_file_id is not in my TrackedProject model definition in previous steps.
        // It might be an old field.
        // I'll comment it out or assume it's not needed if the model doesn't support it.
        // Or maybe I should check TrackedProject.ts again.
        // TrackedProject.ts has: projectId, channelId, guildId, roleIds, projectPlatform.
        // No latest_file_id.
        /*
        await TrackedProjects.update(
          {
            latest_file_id: 111111111,
          },
          {
            where: {
              id: project.id,
            },
          }
        );
        */
    }
}
