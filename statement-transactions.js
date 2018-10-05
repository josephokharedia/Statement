const parse = require('csv-parse');
const {Observable, of} = require('rxjs');
const {delay, bufferTime} = require('rxjs/operators');
const es = require('event-stream');


const statementTransaction$ = (csv, csvMiddleware) => {
    if (!csvMiddleware) throw 'Csv Middleware not defined';
    return Observable.create(observer => {

        console.log('Creating observer');
        this._parser = parse({
            relax_column_count: true,
            ltrim: true,
            rtrim: true
        });

        const transactionStream = es.readArray([csv])
            .pipe(es.split(/(\r?\n)/))
            .pipe(this._parser)
            .pipe(csvMiddleware)
            .pipe(es.map((data, callback) => {
                observer.next(data);
                callback(null, data);
            }));

        transactionStream.on('end', () => {
            console.log('Stream ended!');
            observer.complete();
        })
    });
};

module.exports = statementTransaction$;