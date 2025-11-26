import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class TrackedProject extends Model<InferAttributes<TrackedProject>, InferCreationAttributes<TrackedProject>> {
    declare projectId: string;
    declare projectPlatform: CreationOptional<string>;
    declare channelId: string;
    declare guildId: string;
    declare roleIds: CreationOptional<string[]>;

    async addRoles(roles: { id: string }[]) {
        const roleIds = this.roleIds ?? [];
        for (const role of roles) {
            roleIds.push(role.id);
        }
        return await this.update({ roleIds });
    }

    async addRolesUsingIds(roleIds: string[]) {
        return await this.update({ roleIds });
    }

    static initModel(sequelize: Sequelize) {
        TrackedProject.init(
            {
                projectId: {
                    type: DataTypes.STRING,
                    primaryKey: true,
                },
                projectPlatform: {
                    type: DataTypes.STRING,
                    defaultValue: '---',
                },
                channelId: {
                    type: DataTypes.STRING,
                    primaryKey: true,
                },
                guildId: {
                    type: DataTypes.STRING,
                },
                roleIds: {
                    type: DataTypes.JSON,
                    defaultValue: [],
                    allowNull: true,
                },
            },
            {
                sequelize,
                tableName: 'tracked_projects',
                timestamps: false,
            }
        );
        return TrackedProject;
    }
}
