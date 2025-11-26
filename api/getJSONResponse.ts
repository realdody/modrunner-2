import { IncomingMessage } from 'http';
import { Dispatcher } from 'undici';

export default async function getJSONResponse(body: IncomingMessage | Dispatcher.ResponseData['body']): Promise<any> {
    let fullBody = '';

    for await (const data of body) {
        fullBody += data.toString();
    }

    return JSON.parse(fullBody);
}
