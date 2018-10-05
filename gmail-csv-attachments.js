const https = require('http-debug').https;
const queryString = require('querystring');
const {Observable, EMPTY, of} = require('rxjs');
const {concatMap, map, mergeMap, expand, pluck, filter, first, mergeAll, share, delay} = require('rxjs/operators');
const gmailAccessToken$ = require('./access-token');

https.debug = 1;

const gmailResource$ = (resource) => {

    let _gmailResourceWithAccessToken$ = (accessToken) => {
        return Observable.create((observer) => {
            resource = resource.startsWith("/") ? resource.substr(1) : `${resource}`;
            const options = {
                host: 'www.googleapis.com',
                path: `/gmail/v1/users/me/${resource}`,
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            };
            https.get(options, (res) => {
                res.setEncoding('utf-8');
                let dataStr = '';
                res.on('data', (chunk) => {
                    dataStr += chunk;
                });
                res.on('end', () => {
                    observer.next(JSON.parse(dataStr));
                    observer.complete();
                });
                res.on('error', () => {
                    observer.error(`Failed to get Google resource:${resource} with accessToken:${accessToken}`);
                });
            });
        });
    };

    return gmailAccessToken$.pipe(
        concatMap(accessToken => _gmailResourceWithAccessToken$(accessToken))
    );

};

const gmailLabel$ = (name) => gmailResource$('labels')
    .pipe(
        pluck('labels'),
        mergeAll(),
        filter(label => label.name === name),
        first()
    );

const gmailMessagesWithLabelIds$ = (chunkSize, labelIds = [], interval) => {
    const query = {};
    if (chunkSize && !isNaN(chunkSize) && chunkSize > 0) {
        query.maxResults = chunkSize;
    }
    if (labelIds && labelIds.length) {
        query.labelIds = labelIds;
    }

    const queryParam = Object.keys(query).length ? `?${queryString.stringify(query)}` : '';
    const resource = `messages${queryParam}`;

    const _getNextPageOfMessages = (nextPageToken) => {
        if (!nextPageToken) return EMPTY;
        query.pageToken = nextPageToken;
        const queryParam = Object.keys(query).length ? `?${queryString.stringify(query)}` : '';
        const resource = `messages${queryParam}`;
        return gmailResource$(resource)
    };
    return gmailResource$(resource)
        .pipe(
            /* TODO:
            recursively get next page of messages. Potentially add a volume control here to delay
            getting the next batch of messages */
            expand(chunk => _getNextPageOfMessages(chunk.nextPageToken)),
            filter(chunk => chunk && chunk.messages && chunk.messages.length),
            pluck('messages'),
            mergeAll()
        );
};


const gmailMessagesWithLabel$ = (chunkSize, label, interval) => {
    return gmailLabel$(label)
        .pipe(pluck('id'), concatMap(labelId => gmailMessagesWithLabelIds$(chunkSize, [labelId], interval)));
};

const gmailCsvAttachmentsWithLabel$ = (chunkSize, label, interval) => {
    return gmailMessagesWithLabel$(chunkSize, label, interval)
        .pipe(
            pluck('id'),
            mergeMap(messageId =>
                gmailResource$(`messages/${messageId}`)
                    .pipe(
                        pluck('payload', 'parts'),
                        mergeAll(),
                        filter(part => part.filename.endsWith('csv')),
                        pluck('body', 'attachmentId'),
                        mergeMap(attachmentId => gmailResource$(`messages/${messageId}/attachments/${attachmentId}`)),
                        pluck('data')
                    )
            )
        );
};

module.exports = (chunkSize = 2, labelName = 'INBOX', interval = 0) => {
    return gmailCsvAttachmentsWithLabel$(chunkSize, labelName, interval)
        .pipe(map(data => Buffer.from(data, 'base64').toString('utf8')));
};
