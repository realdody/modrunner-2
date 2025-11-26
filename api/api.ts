// @ts-ignore
import packageJson from '../package.json';

function capitalize(string: string): string {
    return string.replace(string.charAt(0), String.fromCharCode(string.charCodeAt(0) - 32));
}

export const api = {
    _globalConfig: {
        maxRetries: 3,
        userAgent: `${capitalize(packageJson.name)}/${packageJson.version} (modrunner.net)`,
    },
    curseforge: {
        _config: {
            baseUrl: 'https://api.curseforge.com',
            version: '1',
        },
    },
    ftb: {
        _config: {
            baseUrl: 'https://api.modpacks.ch',
        },
    },
    modrinth: {
        _config: {
            baseUrl: 'https://api.modrinth.com',
            version: '2',
        },
    },
};
