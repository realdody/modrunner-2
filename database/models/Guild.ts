import { Model, DataTypes, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Guild extends Model<InferAttributes<Guild>, InferCreationAttributes<Guild>> {
    declare id: string;
    declare changelogLength: CreationOptional<number>;
    declare maxProjects: CreationOptional<number>;
    declare notificationStyle: CreationOptional<'normal' | 'alt' | 'compact' | 'custom' | 'ai'>;

    async setChangelogMaxLength(length: number) {
        this.changelogLength = length;
        await this.save();
    }

    async setMaxTrackedProjects(max: number) {
        this.maxProjects = max;
        await this.save();
    }

    async setNotificationStyle(style: 'normal' | 'alt' | 'compact' | 'custom' | 'ai') {
        this.notificationStyle = style;
        await this.save();
    }

    static initModel(sequelize: Sequelize) {
        Guild.init(
            {
                id: {
                    type: DataTypes.STRING,
                    primaryKey: true,
                },
                changelogLength: {
                    type: DataTypes.INTEGER,
                    defaultValue: 4000,
                },
                maxProjects: {
                    type: DataTypes.INTEGER,
                    defaultValue: 100,
                },
                notificationStyle: {
                    type: DataTypes.STRING,
                    defaultValue: 'normal',
                    validate: {
                        isIn: [['normal', 'alt', 'compact', 'custom', 'ai']],
                    },
                },
            },
            {
                sequelize,
                tableName: 'guilds',
                timestamps: false,
            }
        );
        return Guild;
    }
}
