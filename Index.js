const getCsv = require('./Csv-Statements');

getCsv(1, 'FNB Cheque Statements').pipe(take(4)).subscribe(console.log);
console.log()