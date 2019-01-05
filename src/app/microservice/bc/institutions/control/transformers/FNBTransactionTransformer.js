const stream = require('stream');
const moment = require('moment');
module.exports = class FNBTransactionTransformer extends stream.Transform {
    constructor() {
        super({writableObjectMode: true, readableObjectMode: true, objectMode: true});
        this._fromDate = null;
        this._toDate = null;
    }

    _transform(line, encoding, callback) {

        // 3,'Statement Number','From Date','To Date','Opening Balance','Closing Balance','VAT Paid'
        // 3,92,'11 August 2018','12 September 2018',-177.49,-110.71,-22.70
        if (/[3]/.test(line[0]) && /[0-9]+/.test(line[1])) {
            this._fromDate = moment.utc(line[2].replace(/'/g, ''), 'DD MMM YYYY');
            this._toDate = moment.utc(line[3].replace(/'/g, ''), 'DD MMM YYYY');
            if (!this._fromDate.isValid()) {
                throw Error(`FNB statement from date ${this._fromDate} is not valid`);
            }
            if (!this._toDate.isValid()) {
                throw Error(`FNB statement to date ${this._toDate} is not valid`);
            }
        }

        // 5,'Number','Date','Description1','Description2','Description3','Amount','Balance','Accrued Charges'
        // 5,1,'13 Aug',"FNB OB Pmt","Stella C Okhared","",70000.00,69822.51,
        if (/[5]/.test(line[0]) && /[0-9]+/.test(line[1]) && /[0-9]{2}\s[A-Za-z]{3}/.test(line[2])) {
            const arr = [];
            line[3].trim() && arr.push(line[3].trim());
            line[4].trim() && arr.push(line[4].trim());
            line[5].trim() && arr.push(line[5].trim());

            let description = arr.join(', ');
            let amount = Number(line[6]);
            let balance = Number(line[7]);
            const shortDateString = line[2].replace(/'/g, '');
            const monthNumber = moment.utc(shortDateString, 'DD MMM').format('M');
            const derivedYear = monthNumber < this._fromDate.format('M') ? this._toDate.year() : this._fromDate.year();
            const longDateString = `${shortDateString} ${derivedYear}`;
            const date = moment.utc(longDateString, 'DD MMM YYYY');

            if (!description) {
                throw Error(`FNB transaction description ${description} is not valid`);
            }
            if (Number.isNaN(amount)) {
                throw Error(`FNB transaction amount ${amount} is not valid`);
            }
            if (Number.isNaN(balance)) {
                throw Error(`FNB transaction amount ${balance} is not valid`);
            }
            if (!date.isValid()) {
                throw Error(`FNB transaction date ${longDateString} is not valid`);
            }

            this.push({date: date.toDate(), description, amount, balance});
        }

        callback();
    }
};