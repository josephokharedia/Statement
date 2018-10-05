const {mergeMap,concatMap} = require('rxjs/operators');
const csvAttachments = require('./gmail-csv-attachments');
const transactions$ = require('./statement-transactions');
const mongoose = require('mongoose');
const {fnb} = require('./csv-tx-middleware');

// Get {chunkSize} csv-attachments labeled with name {label} every {interval}
// const chunkSize = 1, label = 'FNB Cheque Statements', interval = 5000000;
// csvAttachments(chunkSize, label, interval)
//     .pipe(mergeMap(  csv => transactions$(csv, fnbTransaction())  ))
//     .subscribe(x => console.log('tx:',x));


mongoose.connect('mongodb://localhost/statement', {
    useCreateIndex: true,
    useNewUrlParser: true
});
const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    accountNo: {type: String},
    date: {type: Date, index: true},
    description: {type: String, index: true},
    amount: {type: Number},
    balance: {type: Number},
    hash: {type: String, unique: true},
}));

const chunkSize = undefined, label = 'FNB Cheque Statements';
csvAttachments(chunkSize, label)
    .pipe(concatMap(csv => transactions$(csv, fnb())))
    .subscribe(tx => new Transaction({...tx}).save(err => {
            if (err) {
                console.log(tx);
                handleError(err);
            }
        }),
        err => handleError(err),
        () => console.log('complete')
    );

process.on('SIGINT', () => {
    console.log('disconnecting mongoose ...');
    mongoose && mongoose.disconnect();
    process.exit();
});

const handleError = (err) => {
    console.log('error occurred!');
    console.log(err.stack);
    throw err;
};
