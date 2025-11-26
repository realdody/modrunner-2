import { Sequelize } from 'sequelize';
import { Guild } from '../database/models/Guild';
import { Project } from '../database/models/Project';
import { TrackedProject } from '../database/models/TrackedProject';

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: './database/db_v4.sqlite',
});

// Initialize models
Guild.initModel(sequelize);
Project.initModel(sequelize);
TrackedProject.initModel(sequelize);

// Initialization
const force = process.argv.includes('--force') || process.argv.includes('-f');
const alter = process.argv.includes('--alter') || process.argv.includes('-a');

if (force) {
    sequelize
        .sync({ force })
        .then(async () => {
            await sequelize.close();
        })
        .catch(console.error);
} else if (alter) {
    sequelize
        .sync({ alter })
        .then(async () => {
            await sequelize.close();
        })
        .catch(console.error);
} else {
    sequelize
        .sync()
        .then(async () => {
            await sequelize.close();
        })
        .catch(console.error);
}
