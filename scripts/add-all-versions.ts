import { Projects } from '../database/db';
// @ts-ignore
import getJSONResponse from '../api/getJSONResponse';
// @ts-ignore
import { getProjects } from '../api/modrinth';

addAllVersions();
async function addAllVersions() {
    const projects = await Projects.findAll({
        where: {
            platform: 'Modrinth',
        },
    });

    await Projects.update(
        {
            fileIds: [],
        },
        {
            where: {
                platform: 'Modrinth',
            },
        }
    );

    const dbModrinthProjectIds = [];
    for (const dbProject of projects) {
        dbModrinthProjectIds.push(dbProject.id);
    }

    let modrinthResponseData = await getProjects(dbModrinthProjectIds);
    if (!modrinthResponseData) return;
    let requestedProjects = await getJSONResponse(modrinthResponseData.body);

    for (const requestedProject of requestedProjects) {
        const dbProject = await Projects.findByPk(requestedProject.id);

        if (dbProject) await dbProject.addFiles(requestedProject.versions);
    }
}
