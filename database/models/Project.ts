import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { getMod } from '../../api/curseforge';
import { getProject, validateIdOrSlug } from '../../api/modrinth';
import getJSONResponse from '../../api/getJSONResponse';
import { TrackedProject } from './TrackedProject';

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
    declare id: string;
    declare platform: string;
    declare name: string;
    declare dateUpdated: Date;
    declare fileIds: CreationOptional<number[]>;
    declare gameId: CreationOptional<number | null>;

    async updateDate(date: Date) {
        this.dateUpdated = date;
        await this.save();
    }

    async updateName(name: string) {
        this.name = name;
        await this.save();
    }

    async addFiles(files: number[]) {
        const fileIds = this.fileIds;
        for (const file of files) {
            fileIds.push(file);
        }
        return await this.update({ fileIds });
    }

    async track(guildId: string, channelId: string) {
        return await TrackedProject.findOrCreate({
            where: {
                projectId: this.id,
                projectPlatform: this.platform,
                guildId: guildId,
                channelId: channelId,
            },
            defaults: {
                projectId: this.id,
                projectPlatform: this.platform,
                guildId: guildId,
                channelId: channelId,
            },
        });
    }

    static async fetch(projectId: string): Promise<Project | null> {
        if (projectId.match(/[A-z]/)) {
            const validationResponse = await validateIdOrSlug(projectId);
            if (!validationResponse || validationResponse.statusCode !== 200) return null;

            const validatedData = await getJSONResponse(validationResponse.body);
            const validatedId = validatedData.id;

            const project = await this.findByPk(validatedId);
            if (project) return project;

            const response = await getProject(validatedId);
            if (!response || response.statusCode !== 200) return null;

            const data = await getJSONResponse(response.body);
            return await this.create({
                id: data.id,
                name: data.title,
                platform: 'Modrinth',
                dateUpdated: data.updated,
                fileIds: data.versions,
            });
        } else {
            const project = await this.findByPk(projectId);
            if (project) return project;

            const response = await getMod(projectId);
            if (!response || response.statusCode !== 200) return null;

            const data = await getJSONResponse(response.body);
            const fileIds = [];
            for (const file of data.data.latestFiles) {
                fileIds.push(file.id);
            }
            return await this.create({
                id: data.data.id,
                name: data.data.name,
                platform: 'CurseForge',
                dateUpdated: data.data.dateReleased,
                fileIds: fileIds,
                gameId: data.data.gameId,
            });
        }
    }

    static initModel(sequelize: Sequelize) {
        Project.init(
            {
                id: {
                    type: DataTypes.STRING,
                    primaryKey: true,
                },
                platform: {
                    type: DataTypes.STRING,
                },
                name: {
                    type: DataTypes.STRING,
                },
                dateUpdated: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                fileIds: {
                    type: DataTypes.JSON,
                    defaultValue: [],
                },
                gameId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
            },
            {
                sequelize,
                tableName: 'projects',
                timestamps: false,
            }
        );
        return Project;
    }
}
