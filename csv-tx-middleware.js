const stream = require('stream');
const hash = require('object-hash');


class FNB extends stream.Transform {
    constructor() {
        super({writableObjectMode: true, readableObjectMode: true, objectMode: true});
        this._accountNumber = null;
        this._fromDate = null;
        this._toDate = null;
        this._nTransactions = 0;
    }

    _transform(line, encoding, callback) {
        let transaction;
        // 2,62295306578,'MR JOSEPH I OKHAREDIA','FNB PREMIER CHEQUE ACCOUNT'
        if (/[2]/.test(line[0]) && /[0-9]+/.test(line[1])) {
            this._accountNumber = line[1];
        }

        // 3,'Statement Number','From Date','To Date','Opening Balance','Closing Balance','VAT Paid'
        // 3,92,'11 August 2018','12 September 2018',-177.49,-110.71,-22.70
        if (/[3]/.test(line[0]) && /[0-9]+/.test(line[1])) {
            this._fromDate = new Date(line[2]);
            this._toDate = new Date(line[3]);
        }

        // 5,'Number','Date','Description1','Description2','Description3','Amount','Balance','Accrued Charges'
        // 5,1,'13 Aug',"FNB OB Pmt","Stella C Okhared","",70000.00,69822.51,
        if (/[5]/.test(line[0]) && /[0-9]+/.test(line[1]) && /[0-9]{2}\s[A-Za-z]{3}/.test(line[2])) {
            let description = line[3].trim().concat(`, ${line[4].trim()}`).concat(`, ${line[5].trim()}`);
            let amount = line[6];
            let balance = line[7];
            let date = new Date(line[2]);

            if (date.getMonth() < this._fromDate.getMonth()) {
                date.setUTCFullYear(this._toDate.getFullYear());
            } else {
                date.setFullYear(this._fromDate.getFullYear());
            }
            date.setSeconds(date.getSeconds() + 1); // Some how javascript interprets '01 Apr' to '31 Mar 00:00:00'
            transaction = {accountNumber: this._accountNumber, date, description, amount, balance};
            transaction.hash = hash({n: this._nTransactions++, ...transaction});
            this.push(transaction);
        }

        callback();
    }
}

class Nedbank extends stream.Transform {
    constructor() {
        super({writableObjectMode: true, readableObjectMode: true, objectMode: true});
        this._accountNumber = null;
        this._nTransactions = 0;
    }

    _transform(line, encoding, callback) {
        let transaction;
        // Account Number : ,1140197096
        if (line[0].toLowerCase().trim().startsWith('account number')) {
            this._accountNumber = line[1];
        }

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
            let date = new Date(line[0]);
            date.setSeconds(date.getSeconds() + 1); // Some how javascript interprets '01 Apr' to '31 Mar 00:00:00'
            transaction = {accountNumber: this._accountNumber, date, description, amount, balance};
            transaction.hash = hash({n: this._nTransactions++, ...transaction});
            this.push(transaction);
        }

        callback();
    }
}


module.exports = {
    fnb: () => {
        return new FNB()
    }, nedbank: () => {
        return new Nedbank()
    }
};