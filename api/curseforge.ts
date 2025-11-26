import { request } from 'undici';
import logger from '../logger';

const config = {
    baseUrl: `https://api.curseforge.com`,
    apiKey: process.env.CURSEFORGE_API_KEY!,
    maxRetries: 3,
    version: '1',
};

export async function getMod(modId: string | number) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/mods/${modId}`, {
                method: 'GET',
                headers: {
                    'x-api-key': config.apiKey,
                },
            });
        } catch (error: any) {
            logger.info(`An ${error.name} has occurred while requesting data from CurseForge (Get Mod)`);
        }
    }
    return null;
}

export async function getModFileChangelog(modId: string | number, fileId: string | number) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/mods/${modId}/files/${fileId}/changelog`, {
                method: 'GET',
                headers: {
                    'x-api-key': config.apiKey,
                },
            });
        } catch (error: any) {
            logger.debug(`A ${error.name} occurred while requesting data from CurseForge (Get Mod File Changelog)`);
        }
    }
    return null;
}

export async function getModFileDownloadUrl(modId: string | number, fileId: string | number) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/mods/${modId}/files/${fileId}/download-url`, {
                method: 'GET',
                headers: {
                    'x-api-key': config.apiKey,
                },
            });
        } catch (error: any) {
            logger.debug(`A ${error.name} occurred while requesting data from CurseForge (Get Mod File Download URL)`);
        }
    }
    return null;
}

export async function getMods(modIds: number[]) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/mods`, {
                body: JSON.stringify({ modIds: modIds }),
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': config.apiKey,
                },
            });
        } catch (error: any) {
            logger.debug(`A ${error.name} occurred while requesting data from CurseForge (Get Mods)`);
        }
    }
    return null;
}

export async function searchMods(query: string) {
    for (let i = config.maxRetries; i > 0; i--) {
        try {
            return await request(`${config.baseUrl}/v${config.version}/mods/search?gameId=432&searchFilter=${new URLSearchParams({ query: query }).toString()}`, {
                method: 'GET',
                headers: {
                    'x-api-key': config.apiKey,
                },
            });
        } catch (error: any) {
            logger.debug(`A ${error.name} occurred while requesting data from CurseForge (Search Mods)`);
        }
    }
    return null;
}
