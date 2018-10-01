const https = require('http-debug').https;
const queryString = require('querystring');
const {Observable, EMPTY, of} = require('rxjs');
const {concatMap, map, mergeMap, tap, share, expand, flatMap, pluck, filter, first, concatAll, mergeAll, delay} = require('rxjs/operators');
const accessTokenObservable = require('./Access-Token');

https.debug = 1;

const googleResourceObservable = (resource) => {

    let getGoogleResourceWithToken = (accessToken) => {
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

    return accessTokenObservable.pipe(
        concatMap(accessToken => getGoogleResourceWithToken(accessToken))
    );

};

const getLabelIdWithNameObservable = (name) => googleResourceObservable('labels')
    .pipe(
        pluck('labels'),
        mergeAll(),
        filter(label => label.name === name),
        first(),
        pluck('id')
    );

const listMessagesObservable = (chunkSize = 1, labelIds = []) => {
    const query = {};
    if (chunkSize && !isNaN(chunkSize) && chunkSize > 0) {
        query.maxResults = chunkSize;
    }
    if (labelIds && labelIds.length) {
        query.labelIds = labelIds;
    }

    const queryParam = Object.keys(query).length ? `?${queryString.stringify(query)}` : '';
    const resource = `messages${queryParam}`;

    const _getNextPage = (nextPageToken) => {
        if (nextPageToken) {
            query.pageToken = nextPageToken;
        }
        else return EMPTY;
        const queryParam = Object.keys(query).length ? `?${queryString.stringify(query)}` : '';
        const resource = `messages${queryParam}`;
        return googleResourceObservable(resource)
    };
    return googleResourceObservable(resource)
        .pipe(
            expand(chunk => _getNextPage(chunk.nextPageToken)),
            pluck('messages'),
            mergeAll()
        );
};


const getMessageIdsWithLabel = (chunkSize, label) => {
    return getLabelIdWithNameObservable(label).pipe(concatMap(id => listMessagesObservable(chunkSize, [id])), pluck('id'));
};

const getCsvAttachmentsOfMessagesWithLabel = (chunkSize, label) => {
    return getMessageIdsWithLabel(chunkSize, label).pipe(
        mergeMap(messageId =>
            googleResourceObservable(`messages/${messageId}`)
                .pipe(
                    pluck('payload', 'parts'),
                    concatAll(),
                    filter(part => part.filename.endsWith('csv')),
                    pluck('body', 'attachmentId'),
                    mergeMap(attachmentId => googleResourceObservable(`messages/${messageId}/attachments/${attachmentId}`)),
                    pluck('data')
                )
        ),
    );
};

module.exports = (chunkSize, labelName) => {
    return getCsvAttachmentsOfMessagesWithLabel(chunkSize, labelName).pipe(map(data => Buffer.from(data, 'base64').toString('utf8')));
};
