import express, { Request, Response } from 'express';
import { Guilds, TrackedProjects, Projects } from '../../database/db';
import { Op } from 'sequelize';
import logger from '../../logger';
import checkPermissionsMiddleware from '../middleware/checkUserPermissions';
import { Client } from 'discord.js';

const router = express.Router();

router.route('/').get(async (request: Request, response: Response) => {
    const client = request.app.locals.client as Client;
    response.status(200).json(client.guilds.cache.map((guild) => guild.id));
});

// Gets a guild's info and tracked projects organized by channel
router
    .route('/:id')
    .get(async (request: Request, response: Response) => {
        // Get guild settings
        const guild = await Guilds.findByPk(request.params.id);
        if (!guild)
            return response.status(200).json({
                id: request.params.id,
                isBotPresent: false,
            });

        const responseData: any = {
            id: guild.id,
            isBotPresent: true,
            changelogLength: guild.changelogLength,
            maxProjects: guild.maxProjects,
            notificationStyle: guild.notificationStyle,
            channels: [],
            roles: [],
        };

        // Get guild's roles
        const client = request.app.locals.client as Client;
        const discordGuild = client.guilds.cache.get(request.params.id);
        if (!discordGuild) return response.status(404).json({ error: 'Guild not found in cache' });

        const guildRoles = discordGuild.roles.cache;

        // Convert Collection to Array to only needed properties
        responseData.roles = guildRoles.map((role) => {
            return {
                id: role.id,
                name: role.name,
                color: role.hexColor,
            };
        });

        // Get guild's tracked projects
        const trackedProjects = await TrackedProjects.findAll({
            where: {
                guildId: guild.id,
            },
        });
        if (!trackedProjects.length) return response.status(200).json(responseData);

        // Add channels and channel tracked projects to response data
        const tempChannels: string[] = [];
        for (const project of trackedProjects) {
            if (tempChannels.includes(project.channelId)) continue;

            tempChannels.push(project.channelId);

            const channelProjectIds: string[] = [];
            for (const prj of trackedProjects) {
                if (prj.channelId === project.channelId) {
                    channelProjectIds.push(prj.projectId);
                }
            }

            let projectDetails = await Projects.findAll({
                where: {
                    id: {
                        [Op.in]: channelProjectIds,
                    },
                },
                attributes: {
                    exclude: ['fileIds'],
                },
            });

            const channelProjects = [];
            for (const detail of projectDetails) {
                const trackedProject = await TrackedProjects.findOne({
                    where: {
                        channelId: project.channelId,
                        projectId: detail.id,
                    },
                });

                if (trackedProject) {
                    channelProjects.push({
                        id: detail.id,
                        platform: detail.platform,
                        name: detail.name,
                        dateUpdated: detail.dateUpdated,
                        roleIds: trackedProject.roleIds,
                    });
                }
            }

            const channel = client.channels.cache.get(project.channelId);
            if (channel) {
                responseData.channels.push({
                    id: project.channelId,
                    name: (channel as any).name,
                    projects: channelProjects,
                });
            }
        }

        return response.status(200).json(responseData);
    })
    .patch(checkPermissionsMiddleware, async (request: Request, response: Response) => {
        const guild = await Guilds.findByPk(request.params.id);
        if (!guild) return response.status(404).end();

        let data: any = {};
        if (request.body.changelogLength && request.body.notificationStyle) {
            data = {
                changelogLength: request.body.changelogLength,
                notificationStyle: request.body.notificationStyle,
            };
        } else if (request.body.changelogLength && !request.body.notificationStyle) {
            data = {
                changelogLength: request.body.changelogLength,
            };
        } else {
            data = {
                notificationStyle: request.body.notificationStyle,
            };
        }

        let updated = [0];
        try {
            updated = await Guilds.update(data, {
                where: {
                    id: guild.id,
                },
            });
        } catch (error) {
            logger.error(error);
        }

        if (updated[0] > 0) {
            response.status(204).end();
        } else {
            response.status(404).end();
        }
    });

router.route('/:id/projects').get(async (req: Request, res: Response) => {
    const projects = await TrackedProjects.findAll({
        where: {
            guildId: req.params.id,
        },
    });
    if (projects) {
        res.status(200).json(projects);
    } else {
        res.status(404);
    }
});

// Get a guild's channels
router.route('/:id/channels').get(async (request: Request, response: Response) => {
    const client = request.app.locals.client as Client;
    const guild = client.guilds.cache.get(request.params.id);
    if (!guild) return response.status(404).json();

    const guildChannels = guild.channels.cache;

    // Remove any channel that is not a text or forum channel channels
    guildChannels.sweep((channel) => {
        return channel.type !== 0 && channel.type !== 15;
    });

    // Convert Collection to Array to only needed properties
    const guildChannelsArray = guildChannels.map((channel) => {
        return {
            id: channel.id,
            name: channel.name,
            type: getChannelTypeEnum(channel.type),
            position: (channel as any).rawPosition,
        };
    });

    return response.status(200).json(guildChannelsArray);
});

// Get a guild's roles
router.route('/:id/roles').get(async (request: Request, response: Response) => {
    const client = request.app.locals.client as Client;
    const guild = client.guilds.cache.get(request.params.id);
    if (!guild) return response.status(404).json();

    const guildRoles = guild.roles.cache;

    // Convert Collection to Array to only needed properties
    const guildRolesArray = guildRoles.map((role) => {
        return {
            id: role.id,
            name: role.name,
            color: role.hexColor,
        };
    });

    return response.status(200).json(guildRolesArray);
});

export default router;

function getChannelTypeEnum(type: number) {
    if (type === 0) {
        return 'text';
    } else if (type === 15) {
        return 'forum';
    } else {
        return 'unknown';
    }
}
