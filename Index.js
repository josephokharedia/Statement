const getCsv = require('./Csv-Statements.js');
const {take} = require('rxjs/operators');

console.log(getCsv);
getCsv(1, 'FNB Cheque Statements').pipe(take(1)).subscribe(console.log);