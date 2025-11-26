import { ChannelType } from 'discord-api-types/v10';
import { PermissionsBitField, SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, ForumChannel, Role } from 'discord.js';
import logger from '../logger';
import { Projects, TrackedProjects, Guilds } from '../database/db';
import { Command } from '../types';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('track')
        .setDescription('Track a Modrinth or CurseForge project and get notified when it gets updated.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .addStringOption((option) => option.setName('projectid').setDescription("The project's ID.").setRequired(true))
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('The channel you want project update notifications posted to.')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
        )
        .addRoleOption((option) => option.setName('role').setDescription('A role that you want to mention when this project sends an update notification.')),
    async execute(interaction: ChatInputCommandInteraction) {
        const projectId = interaction.options.getString('projectid')!;
        const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel | ForumChannel;
        const role = interaction.options.getRole('role') as Role | null;

        if (!interaction.guild) return;

        await interaction.deferReply();

        // Check if the client can see the channel to post updates to
        if (!channel.viewable) {
            await interaction.editReply(`:x: ${channel} cannot be seen or used by Modrunner. Please check to ensure the bot has the appropriate permissions.`);
            return;
        }

        // Fetch the project from the database
        // If the project isn't there, it calls the API and adds it
        const project = await Projects.fetch(projectId);
        if (!project) {
            await interaction.editReply(`:warning: No project exists with ID **${projectId}**.`);
            return;
        }

        logger.info(`User ${interaction.user.tag} made a tracking request for project ${project.name} (${project.id}).`);

        // Find how many projects this guild is already tracking
        // If greater than the guild's max allowed tracked projects (usually 100), don't allow this project to be tracked
        let guildSettings = await Guilds.findByPk(interaction.guild.id);
        if (!guildSettings) {
            guildSettings = await Guilds.create({
                id: interaction.guild.id,
            });
            logger.info(`Initialized settings for guild ${interaction.guild.name} (${interaction.guild.id})`);
        }

        const currentlyTracked = await TrackedProjects.count({
            where: {
                guildId: interaction.guild.id,
            },
        });
        if (currentlyTracked >= guildSettings.maxProjects) {
            await interaction.editReply(':x: Your server has reached its maximum limit of tracked projects and cannot track any more.');
            return;
        }

        // Track the project
        // This #track method returns an array with the model as the first element and a boolean indicating if a new entry
        // was created (tracking successful) as the second element
        const trackRequest = await project.track(interaction.guild.id, channel.id);
        const trackedProject = trackRequest[0];
        const created = trackRequest[1];
        if (!created) {
            if (role) {
                // Add the role to the tracked project
                await trackedProject.addRoles([role]);
                await interaction.editReply(`:white_check_mark: The role **${role.name}** will now be notified when this project receives updates.`);
            } else {
                await interaction.editReply(`:warning: Project **${project.name}** is already tracked in ${channel}.`);
            }
        } else {
            if (role) {
                // Add the role to the tracked project
                await trackedProject.addRoles([role]);
                await interaction.editReply(
                    `:white_check_mark: Project **${project.name}** tracked successfully. Its updates will be posted to ${channel}, and the role **${role.name}** will be notified.`
                );
            } else {
                await interaction.editReply(`:white_check_mark: Project **${project.name}** tracked successfully. Its updates will be posted to ${channel}.`);
            }
        }
    },
};

export default command;
