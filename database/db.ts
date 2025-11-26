import { Sequelize } from 'sequelize';
import { Guild } from './models/Guild';
import { Project } from './models/Project';
import { TrackedProject } from './models/TrackedProject';

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: './database/db_v4.sqlite',
});

// Initialize models
Guild.initModel(sequelize);
Project.initModel(sequelize);
TrackedProject.initModel(sequelize);

export { sequelize, Guild, Project, TrackedProject };
export const Guilds = Guild;
export const Projects = Project;
export const TrackedProjects = TrackedProject;
