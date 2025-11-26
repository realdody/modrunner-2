import express, { Request, Response } from 'express';
import { Guilds, Projects, TrackedProjects } from '../../database/db';
import logger from '../../logger';
import checkPermissionsMiddleware from '../middleware/checkUserPermissions';

const router = express.Router();

router.get('/:id', async (request: Request, response: Response) => {
    const project = await Projects.findByPk(request.params.id);
    if (!project) {
        response.status(404).json({
            error: `No project with ID ${request.params.id} found in database.`,
        });
    } else {
        response.status(200).json(project);
    }
});

router.post('/track', checkPermissionsMiddleware, async (request: Request, response: Response) => {
    if (!request.body.projectId || !request.body.guildId || !request.body.channelId || !request.body.roleIds) {
        return response.status(400).json({
            error: `Missing required body parameters: ${!request.body.projectId ? 'projectId' : ''} ${!request.body.guildId ? 'guildId' : ''} ${!request.body.channelId ? 'channelId' : ''
                } ${!request.body.roleIds ? 'roleIds' : ''}`,
        });
    }

    const project = await Projects.fetch(request.body.projectId);
    if (!project) return response.status(404).json({ error: `No project exists with ID ${request.body.projectId}` });

    const guildSettings = await Guilds.findByPk(request.body.guildId, { attributes: ['maxProjects'] });
    if (!guildSettings) return response.status(404).json({ error: 'Guild not found' });

    const currentlyTrackedNumber = await TrackedProjects.count({
        where: {
            guildId: request.body.guildId,
        },
    });

    if (guildSettings.maxProjects !== undefined && currentlyTrackedNumber >= guildSettings.maxProjects)
        return response.status(403).json({ error: 'This guild has reached its maximum number of allowed tracked projects.' });

    // eslint-disable-next-line no-unused-vars
    const [trackedProject, created] = await project.track(request.body.guildId, request.body.channelId);

    if (request.body.roleIds.length) {
        // Add the role to the tracked project
        await trackedProject.addRolesUsingIds(request.body.roleIds);
    }

    if (created) return response.status(201).end();
    return response.status(204).end();
});

router.delete('/untrack', checkPermissionsMiddleware, async (request: Request, response: Response) => {
    let deleted = 0;
    try {
        deleted = await TrackedProjects.destroy({
            where: {
                projectId: request.body.projectId,
                channelId: request.body.channelId,
                guildId: request.body.guildId,
            },
        });
    } catch (error) {
        logger.error(error);
    }

    if (deleted > 0) {
        response.status(204).end();
    } else {
        response.status(404).end();
    }
});

router.patch('/edit', checkPermissionsMiddleware, async (request: Request, response: Response) => {
    let updated = [0];
    try {
        updated = await TrackedProjects.update(
            {
                channelId: request.body.newProject.channelId,
                roleIds: request.body.newProject.roleIds,
            },
            {
                where: {
                    projectId: request.body.oldProject.projectId,
                    channelId: request.body.oldProject.channelId,
                    guildId: request.body.oldProject.guildId,
                },
            }
        );
    } catch (error) {
        logger.error(error);
    }

    if (updated[0] > 0) {
        response.status(204).end();
    } else {
        response.status(404).end();
    }
});

export default router;
