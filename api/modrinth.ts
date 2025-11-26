import { request } from 'undici';
import logger from '../logger';
// @ts-ignore
import packageJson from '../package.json';

const config = {
    baseUrl: `https://api.modrinth.com`,
    maxRetries: 3,
    userAgent: `${capitalize(packageJson.name)}/${packageJson.version} (modrunner.net)`,
    version: '2',
};

function capitalize(string: string) {
    return string.replace(string.charAt(0), String.fromCharCode(string.charCodeAt(0) - 32));
}

export async function getProject(projectId: string) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/project/${projectId}`, {
                method: 'GET',
                headers: {
                    'user-agent': config.userAgent,
                },
            });
        } catch (error: any) {
            logger.error(`A ${error.name} has occurred while requesting data from Modrinth (Get Project)`);
        }
    }
    return null;
}

export async function getProjects(projectIds: string[]) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            const formattedIds = projectIds.map((id) => '"' + id + '"');
            return await request(`${config.baseUrl}/v${config.version}/projects?ids=[${formattedIds}]`, {
                method: 'GET',
                headers: {
                    'user-agent': config.userAgent,
                },
            });
        } catch (error: any) {
            logger.error(`A ${error.name} has occurred while requesting data from Modrinth (Get Projects)`);
        }
    }
    return null;
}

export async function listProjectVersions(projectId: string) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/project/${projectId}/version`, {
                method: 'GET',
                headers: {
                    'user-agent': config.userAgent,
                },
            });
        } catch (error: any) {
            logger.error(`A ${error.name} has occurred while requesting data from Modrinth (List Project Versions)`);
        }
    }
    return null;
}

export async function searchProjects(query: string) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/search?${new URLSearchParams({ query: query }).toString()}`, {
                method: 'GET',
                headers: {
                    'User-Agent': config.userAgent,
                },
            });
        } catch (error: any) {
            logger.error(`A ${error.name} has occurred while requesting data from Modrinth (Search Projects)`);
        }
    }
    return null;
}

export async function validateIdOrSlug(idOrSlug: string) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/project/${idOrSlug}/check`, {
                method: 'GET',
                headers: {
                    'User-Agent': config.userAgent,
                },
            });
        } catch (error: any) {
            logger.error(`A ${error.name} has occurred while requesting data from Modrinth (Validate ID or Slug)`);
        }
    }
    return null;
}
