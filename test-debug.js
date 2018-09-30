const {Observable, ReplaySubject} = require('rxjs');
const {share, shareReplay, takeUntil, take} = require('rxjs/operators');
const https = require('http-debug').https;
https.debug = 1;

_latestReceivedName = null;
_subject = new ReplaySubject(1);


function getFirstName() {
    return Observable.create((observer) => {

        let _getName = () => {
            getName()
                .then(name => {
                    console.log('got new name:', name.first);
                    observer.next(name.first);
                    setTimeout(_getName, name.expires_in);
                }, err => observer.error(err))
                .catch(err => observer.error(err));
        };
        setTimeout(_getName, 0);

    }).pipe(shareReplay(1), take(1));
}


async function getName() {

    const options = {
        scheme: 'https',
        method: 'GET',
        host: 'api.randomuser.me'
    };

    return new Promise((resolve, reject) => {

        https.request(options, res => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let name = JSON.parse(data).results[0].name;
                name.expires_in = 2000;
                name.expiry_timestamp = Date.now() + parseInt(name.expires_in);
                resolve(name);
            });
            res.on('error', err => reject(err));
        }).end();

    });
}


const observable = getFirstName();
observable.subscribe(name => console.log('name-1:', name));
observable.subscribe(name => console.log('name-2:', name));
observable.subscribe(name => console.log('name-3:', name));
//
setTimeout(() => {
    observable.subscribe(name => console.log('name-4:', name));
}, 4000);
setTimeout(() => {
    observable.subscribe(name => console.log('name-5:', name));
}, 7000);
setTimeout(() => {
    observable.subscribe(name => console.log('name-6:', name));
}, 9000);
//

// let i = 0;
//
// async function getRandomNumber() {
//     return new Promise((res, rej) => {
//         res({
//             number: Math.floor((Math.random() * 100) + 1),
//             expires_in: 2000 * (i++)
//         });
//     });
// }
//
//
// let counter = 0;
// let myFunction = function () {
//     getRandomNumber().then(random => {
//         console.log("random:", random);
//         counter = random.expires_in;
//         setTimeout(myFunction, counter);
//     });
//
// };
// setTimeout(myFunction, counter);