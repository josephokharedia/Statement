const https = require('http-debug').https;
const {Observable} = require('rxjs');
const {share,shareReplay,publishReplay} = require('rxjs/operators');

https.debug = 1;

async function getName(){
    const options={
        scheme: 'https',
        method: 'GET',
        host: 'api.randomuser.me'
    };
    return new Promise((resolve,reject) => {

        https.request(options, res => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data',chunk => data+=chunk);
            res.on('end', () => resolve(JSON.parse(data).results[0].name.first) );
            res.on('error', err => {throw new Error(err)});
        }).end();

    });
}

function getNameObservable(){
    return Observable.create(observer => {

        console.log("calling _subscribe");
        getName().then(name => {
            observer.next(name);
            observer.complete();
        }, err => {
            observer.reject(err);
            observer.complete();
        }).catch(err => {
            observer.reject(err);
            observer.complete();
        });

    }).pipe(shareReplay(1,1000));
}

const observable = getNameObservable();
observable.subscribe(name => console.log('name-1:',name));
observable.subscribe(name => console.log('name-2:',name));
observable.subscribe(name => console.log('name-3:',name));

setTimeout(() => {
    console.log('waiting for name-4');
    observable.subscribe(name => console.log('name-4:',name), err => console.log("err:", err), () => console.log("complete"));
},3000);
// setTimeout(() => {
//     console.log('waiting for name-5');
//     observable.subscribe(name => console.log('name-5:',name));
// },6000);