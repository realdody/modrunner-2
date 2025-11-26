import { ChannelType } from 'discord-api-types/v10';
import { getModFileChangelog } from './api/curseforge';
import logger from './logger';
import getJSONResponse from './api/getJSONResponse';
import { listProjectVersions } from './api/modrinth';
import { TrackedProjects, Guilds } from './database/db';
import { EmbedBuilder, codeBlock, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, Client, TextChannel, ForumChannel } from 'discord.js';
import dayjs from 'dayjs';


interface DbProject {
    id: string;
    platform: string;
    name: string;
}

interface RequestedProject {
    id: string | number;
    slug: string;
    name: string;
    logo: { url: string };
    icon_url: string;
    project_type: string;
    classId: number;
    latestFiles: Array<{
        id: number;
        fileDate: string;
        displayName: string;
        fileName: string;
        releaseType: number;
    }>;
    latestFilesIndexes: Array<{
        fileId: number;
    }>;
}

interface VersionData {
    changelog: string;
    date: string;
    iconURL: string;
    name: string;
    number: string | number;
    type: string;
    url: string;
}

/**
 * Handles sending update notifications to the appropriate guild channels where a project is tracked
 * @param requestedProject - The project's API data
 * @param dbProject - The project's database data
 * @param client - The Discord client
 */
export async function sendUpdateEmbed(requestedProject: RequestedProject, dbProject: DbProject, client: Client) {
    let versionData: VersionData;

    // Behavior is slightly different depending on platform, mostly dependent on the data returned from the initial earlier API call
    switch (dbProject.platform) {
        case 'CurseForge': {
            // Call the CurseForge API to get this file's changelog
            const response = await getModFileChangelog(requestedProject.id, requestedProject.latestFiles[requestedProject.latestFiles.length - 1].id);
            if (!response) return logger.warn("A request to CurseForge timed out while getting a project file's changelog");
            if (response.statusCode !== 200) return logger.warn(`Unexpected ${response.statusCode} status code while getting a project files's changelog.`);

            const rawData = await getJSONResponse(response.body);
            versionData = {
                changelog: rawData.data,
                date: requestedProject.latestFiles[requestedProject.latestFiles.length - 1].fileDate,
                iconURL: requestedProject.logo.url,
                name: requestedProject.latestFiles[requestedProject.latestFiles.length - 1].displayName,
                number: requestedProject.latestFiles[requestedProject.latestFiles.length - 1].fileName,
                type: capitalize(releaseTypeToString(requestedProject.latestFiles[requestedProject.latestFiles.length - 1].releaseType)),
                url: `https://www.curseforge.com/minecraft/${classIdToUrlString(requestedProject.classId)}/${requestedProject.slug}/files/${requestedProject.latestFilesIndexes[0].fileId
                    }`,
            };

            logger.debug(versionData);

            break;
        }
        case 'Modrinth': {
            // Call the Modrinth API to get this version's information
            const response = await listProjectVersions(requestedProject.id.toString());
            if (!response) return logger.warn("A request to Modrinth timed out while getting a project's version information");
            if (response.statusCode !== 200) return logger.warn(`Unexpected ${response.statusCode} status code while getting a project's version information.`);

            const rawData = await getJSONResponse(response.body);
            versionData = {
                changelog: rawData[0].changelog,
                date: rawData[0].date_published,
                iconURL: requestedProject.icon_url,
                name: rawData[0].name,
                number: rawData[0].version_number,
                type: capitalize(rawData[0].version_type),
                url: `https://modrinth.com/${requestedProject.project_type}/${requestedProject.slug}/version/${rawData[0].id}`,
            };

            logger.debug(versionData);

            break;
        }
        default:
            return logger.warn('Update notification functionality has not been implemented for this platform yet.');
    }

    // Send the notification to each appropriate guild channel
    const trackedProjects = await TrackedProjects.findAll({
        where: {
            projectId: dbProject.id,
        },
    });

    for (const trackedProject of trackedProjects) {
        const guild = client.guilds.cache.get(trackedProject.guildId);
        if (!guild) {
            logger.warn(`Could not find guild with ID ${trackedProject.guildId} in cache. Update notification not sent.`);
            continue;
        }
        const channel = guild.channels.cache.get(trackedProject.channelId);
        if (!channel) {
            logger.warn(`Could not find channel with ID ${trackedProject.channelId} in cache. Update notification not sent.`);
            continue;
        }

        // Check to see if Modrunner has permissions to post in the update channel
        if (!channel.viewable || !channel.permissionsFor(client.user!.id)?.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
            logger.warn(
                `Could not post notification in channel ${channel.name} (${channel.id}) in guild ${guild.name} (${guild.id}) due to insufficient permissions.`
            );
            continue;
        }

        const guildSettings = await Guilds.findByPk(trackedProject.guildId);
        if (!guildSettings) {
            logger.warn(`Could not find settings for guild ${trackedProject.guildId}. Using defaults.`);
            // Continue with defaults or skip?
            // If I skip, no notification.
            // If I continue, I need a default object.
            // Let's skip for now as it's safer than guessing defaults that might crash later if I miss something.
            continue;
        }

        const roleIds = trackedProject.roleIds;
        let rolesString: string | undefined;
        if (roleIds && roleIds.length > 0) {
            const mentionableRoles = roleIds.map((roleId: string) => `<@&${roleId}>`);
            rolesString = mentionableRoles.join(' ');
        }

        const textChannel = channel as TextChannel | ForumChannel;

        switch (guildSettings.notificationStyle) {
            case 'alt':
                if (channel.type === ChannelType.GuildForum) {
                    await (channel as ForumChannel).threads
                        .create({
                            name: `${versionData.name}`,
                            message: {
                                content: roleIds ? `${rolesString}` : undefined,
                                embeds: [
                                    new EmbedBuilder()
                                        .setAuthor(embedAuthorData(dbProject.platform))
                                        .setColor(embedColorData(dbProject.platform))
                                        .setDescription(`${trimChangelog(versionData.changelog, guildSettings.changelogLength)}`)
                                        .setFields(
                                            {
                                                name: 'Version Name',
                                                value: versionData.name,
                                            },
                                            {
                                                name: 'Version Number',
                                                value: `${versionData.number}`,
                                            },
                                            {
                                                name: 'Release Type',
                                                value: `${versionData.type}`,
                                            },
                                            {
                                                name: 'Date Published',
                                                value: `<t:${dayjs(versionData.date).unix()}:f>`,
                                            }
                                        )
                                        .setThumbnail(versionData.iconURL)
                                        .setTimestamp()
                                        .setTitle(`${dbProject.name} has been updated`),
                                ],
                                components: [
                                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                                        new ButtonBuilder().setLabel(`View on ${dbProject.platform}`).setStyle(ButtonStyle.Link).setURL(versionData.url)
                                    ),
                                ],
                            },
                        })
                        .catch((error) => logger.error(error));
                } else {
                    await (channel as TextChannel).send({
                        content: roleIds ? `${rolesString}` : undefined,
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor(embedAuthorData(dbProject.platform))
                                .setColor(embedColorData(dbProject.platform))
                                .setDescription(`${trimChangelog(versionData.changelog, guildSettings.changelogLength)}`)
                                .setFields(
                                    {
                                        name: 'Version Name',
                                        value: versionData.name,
                                    },
                                    {
                                        name: 'Version Number',
                                        value: `${versionData.number}`,
                                    },
                                    {
                                        name: 'Release Type',
                                        value: `${versionData.type}`,
                                    },
                                    {
                                        name: 'Date Published',
                                        value: `<t:${dayjs(versionData.date).unix()}:f>`,
                                    }
                                )
                                .setThumbnail(versionData.iconURL)
                                .setTimestamp()
                                .setTitle(`${dbProject.name} has been updated`),
                        ],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder().setLabel(`View on ${dbProject.platform}`).setStyle(ButtonStyle.Link).setURL(versionData.url)
                            ),
                        ],
                    });
                }
                logger.info(
                    `Sent ${guildSettings.notificationStyle} notification for project ${dbProject.name} (${dbProject.id}) in guild ${channel.guild.name} (${channel.guild.id}) in channel ${channel.name} (${channel.id}) for version ${versionData.name} (${versionData.number})`
                );
                break;
            case 'compact':
                if (channel.type === ChannelType.GuildForum) {
                    await (channel as ForumChannel).threads.create({
                        name: `${versionData.name}`,
                        message: {
                            content: roleIds ? `${rolesString}` : undefined,
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(embedColorData(dbProject.platform))
                                    .setDescription(`${versionData.number} (${versionData.type})`)
                                    .setFooter({
                                        text: `${dayjs(versionData.date).format('MMM D, YYYY')}`,
                                        iconURL: embedAuthorData(dbProject.platform).iconURL ?? undefined,
                                    })
                                    .setTitle(`${dbProject.name} ${versionData.name}`)
                                    .setURL(versionData.url),
                            ],
                        },
                    });
                } else {
                    await (channel as TextChannel).send({
                        content: roleIds ? `${rolesString}` : undefined,
                        embeds: [
                            new EmbedBuilder()
                                .setColor(embedColorData(dbProject.platform))
                                .setDescription(`${versionData.number} (${versionData.type})`)
                                .setFooter({
                                    text: `${dayjs(versionData.date).format('MMM D, YYYY')}`,
                                    iconURL: embedAuthorData(dbProject.platform).iconURL ?? undefined,
                                })
                                .setTitle(`${dbProject.name} ${versionData.name}`)
                                .setURL(versionData.url),
                        ],
                    });
                }
                logger.info(
                    `Sent ${guildSettings.notificationStyle} notification for project ${dbProject.name} (${dbProject.id}) in guild ${channel.guild.name} (${channel.guild.id}) in channel ${channel.name} (${channel.id}) for version ${versionData.name} (${versionData.number})`
                );
                break;

            default:
                if (channel.type === ChannelType.GuildForum) {
                    await (channel as ForumChannel).threads
                        .create({
                            name: `${versionData.name}`,
                            message: {
                                content: roleIds ? `${rolesString}` : undefined,
                                embeds: [
                                    new EmbedBuilder()
                                        .setAuthor(embedAuthorData(dbProject.platform))
                                        .setColor(embedColorData(dbProject.platform))
                                        .setDescription(`**Changelog:** ${codeBlock(trimChangelog(versionData.changelog, guildSettings.changelogLength))}`)
                                        .setFields(
                                            {
                                                name: 'Version Name',
                                                value: versionData.name,
                                            },
                                            {
                                                name: 'Version Number',
                                                value: `${versionData.number}`,
                                            },
                                            {
                                                name: 'Release Type',
                                                value: `${versionData.type}`,
                                            },
                                            {
                                                name: 'Date Published',
                                                value: `<t:${dayjs(versionData.date).unix()}:f>`,
                                            }
                                        )
                                        .setThumbnail(versionData.iconURL)
                                        .setTimestamp()
                                        .setTitle(`${dbProject.name} has been updated`),
                                ],
                                components: [
                                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                                        new ButtonBuilder().setLabel(`View on ${dbProject.platform}`).setStyle(ButtonStyle.Link).setURL(versionData.url)
                                    ),
                                ],
                            },
                        })
                        .catch((error) => logger.error(error));
                } else {
                    await (channel as TextChannel).send({
                        content: roleIds ? `${rolesString}` : undefined,
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor(embedAuthorData(dbProject.platform))
                                .setColor(embedColorData(dbProject.platform))
                                .setDescription(`**Changelog:** ${codeBlock(trimChangelog(versionData.changelog, guildSettings.changelogLength))}`)
                                .setFields(
                                    {
                                        name: 'Version Name',
                                        value: versionData.name,
                                    },
                                    {
                                        name: 'Version Number',
                                        value: `${versionData.number}`,
                                    },
                                    {
                                        name: 'Release Type',
                                        value: `${versionData.type}`,
                                    },
                                    {
                                        name: 'Date Published',
                                        value: `<t:${dayjs(versionData.date).unix()}:f>`,
                                    }
                                )
                                .setThumbnail(versionData.iconURL)
                                .setTimestamp()
                                .setTitle(`${dbProject.name} has been updated`),
                        ],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder().setLabel(`View on ${dbProject.platform}`).setStyle(ButtonStyle.Link).setURL(versionData.url)
                            ),
                        ],
                    });
                }
                logger.info(
                    `Sent ${guildSettings.notificationStyle} notification for project ${dbProject.name} (${dbProject.id}) in guild ${channel.guild.name} (${channel.guild.id}) in channel ${channel.name} (${channel.id}) for version ${versionData.name} (${versionData.number})`
                );
        }
    }
}


function classIdToUrlString(classId: number): string {
    switch (classId) {
        case 5:
            return 'bukkit-plugins';
        case 6:
            return 'mc-mods';
        case 12:
            return 'texture-packs';
        case 17:
            return 'worlds';
        case 4471:
            return 'modpacks';
        case 4546:
            return 'customization';
        case 4559:
            return 'mc-addons';
        default:
            return 'unknownClassIdValue';
    }
}

function releaseTypeToString(releaseType: number): string {
    switch (releaseType) {
        case 1:
            return 'release';
        case 2:
            return 'beta';
        case 3:
            return 'alpha';
        default:
            return 'unknownReleaseType';
    }
}

function capitalize(string: string): string {
    return string.replace(string.charAt(0), String.fromCharCode(string.charCodeAt(0) - 32));
}

function embedAuthorData(platform: string): { name: string; iconURL?: string; url?: string } {
    switch (platform) {
        case 'CurseForge':
            return {
                name: 'From curseforge.com',
                iconURL: 'https://i.imgur.com/uA9lFcz.png',
                url: 'https://curseforge.com',
            };
        case 'Modrinth':
            return {
                name: 'From modrinth.com',
                iconURL: 'https://i.imgur.com/2XDguyk.png',
                url: 'https://modrinth.com',
            };
        default:
            return {
                name: 'From unknown source',
            };
    }
}

function embedColorData(platform: string): import('discord.js').ColorResolvable {
    switch (platform) {
        case 'CurseForge':
            return '#f87a1b';
        case 'Modrinth':
            return '#1bd96a';
        default:
            return 'DarkGreen';
    }
}

function trimChangelog(changelog: string, maxLength: number = 2000): string {
    const formattedChangelog = formatHtmlChangelog(changelog);
    return formattedChangelog.length > maxLength ? `${formattedChangelog.slice(0, maxLength - 3)}...` : formattedChangelog;
}

function formatHtmlChangelog(changelog: string): string {
    return changelog
        .replace(/<br>/g, '\n') // Fix line breaks
        .replace(/<.*?>/g, '') // Remove HTML tags
        .replace(/&\w*?;/g, ''); // Remove HTMl special characters
}
