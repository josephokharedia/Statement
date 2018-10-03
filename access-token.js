const queryString = require('querystring');
const {Observable} = require('rxjs');
const {shareReplay, take} = require('rxjs/operators');
const https = require('http-debug').https;
https.debug = 1;


module.exports = Observable.create((observer) => {
    let _getAccessTokenPeriodically = () => {
        getAuthToken()
            .then(authToken => {
                observer.next(authToken.access_token);
                setTimeout(_getAccessTokenPeriodically, (authToken.expires_in * 1000));
            }, err => observer.error(err))
            .catch(err => observer.error(err));
    };
    setTimeout(_getAccessTokenPeriodically, 0);
}).pipe(shareReplay(1), take(1));


async function getAuthToken() {
    const postBody = queryString.stringify({
        client_id: '308670926753-cifuu74qum7u9h2564u79ttifji880h5.apps.googleusercontent.com',
        client_secret: 'dweuE9eB-Mgonw43dTBIR5bw',
        refresh_token: '1/fZnI1Vn7mFubt5DU1UB_nJtTVgNqo-n_lvILQ4Atdio',
        grant_type: 'refresh_token'
    });
    const options = {
        scheme: 'https',
        hostname: 'www.googleapis.com',
        path: '/oauth2/v4/token',
        port: 443,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            res.setEncoding('utf-8');
            let authTokenStr = '';
            res.on('data', (chunk) => {
                authTokenStr += chunk;
            });
            res.on('end', () => {
                resolve(JSON.parse(authTokenStr));
            });
            res.on('error', () => {
                reject('Failed to get access token using refresh token');
            });
        });

        req.end(postBody);
    })
}