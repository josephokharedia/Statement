const stream = require('stream');
const moment = require('moment');
module.exports = class NedbankTransactionTransformer extends stream.Transform {
    constructor() {
        super({writableObjectMode: true, readableObjectMode: true, objectMode: true});
    }

    _transform(line, encoding, callback) {

        // 19Sep2018,   PROVISIONAL STATEMENT,0,0,,
        // 19Sep2018,BROUGHT FORWARD,0,7310.98,,
        // 19Sep2018,Fikile Airtime,-50,7260.98,,
        if (/[0-9]{2}[A-Za-z]{3}[0-9]{4}/.test(line[0])) {
            let testDescr = line[1].toLowerCase().trim();
            if (testDescr.startsWith('brought forward') ||
                testDescr.startsWith('carried forward') ||
                testDescr.startsWith('provisional statement')) return;
            let description = line[1];
            let amount = line[2];
            let balance = line[3];
            let date = moment.utc(line[0], 'DDMMMYYYY').startOf('day');

            if (!description) {
                throw Error(`Nedbank transaction description ${description} is not valid`);
            }
            if (Number.isNaN(amount)) {
                throw Error(`Nedbank transaction amount ${amount} is not valid`);
            }
            if (Number.isNaN(balance)) {
                throw Error(`Nedbank transaction amount ${balance} is not valid`);
            }
            if (!date.isValid()) {
                throw Error(`Nedbank transaction date ${date} is not valid`);
            }

            this.push({date: date.toDate(), description, amount, balance});
        }

        callback();
    }
};