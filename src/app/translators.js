const stream = require('stream');

class FNBTransaction extends stream.Transform {
    constructor() {
        super({writableObjectMode: true, readableObjectMode: true, objectMode: true});
        this._fromDate = null;
        this._toDate = null;
    }

    _transform(line, encoding, callback) {

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
            let amount = Number(line[6]);
            let balance = Number(line[7]);
            let date = new Date(line[2]);

            if (date.getMonth() < this._fromDate.getMonth()) {
                date.setUTCFullYear(this._toDate.getFullYear())
            } else {
                date.setFullYear(this._fromDate.getFullYear());
            }
            date.setSeconds(date.getSeconds() + 1); // Some how javascript interprets '01 Apr' to '31 Mar 00:00:00'
            this.push({date, description, amount, balance});
        }

        callback();
    }
}

class NedbankTransaction extends stream.Transform {
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
            let date = new Date(line[0]);
            date.setSeconds(date.getSeconds() + 1); // Some how javascript interprets '01 Apr' to '31 Mar 00:00:00'
            this.push({date, description, amount, balance});
        }

        callback();
    }
}


class FNBStatement extends stream.Transform {
    constructor() {
        super({objectMode: true, writableObjectMode: true, readableObjectMode: true});
        this.accountNumber = null;
        this.accountDescription = null;
        this.statementNumber = null;
    }

    _transform(chunk, encoding, callback) {

        // 2,62295306578,'MR JOSEPH I OKHAREDIA','FNB PREMIER CHEQUE ACCOUNT'
        if (/[2]/.test(chunk[0]) && /[0-9]+/.test(chunk[1])) {
            this.accountNumber = chunk[1];
            this.accountDescription = chunk[3];
        }

        // 3,'Statement Number','From Date','To Date','Opening Balance','Closing Balance','VAT Paid'
        // 3,92,'11 August 2018','12 September 2018',-177.49,-110.71,-22.70
        else if (/[3]/.test(chunk[0]) && /[0-9]+/.test(chunk[1])) {
            this.statementNumber = chunk[1];
            this.push({
                accountNumber: this.accountNumber,
                accountDescription: this.accountDescription,
                statementNumber: this.statementNumber,
                institution: 'FNB',
            });
        }

        callback();
    }
}


class NedbankStatement extends stream.Transform {
    constructor() {
        super({objectMode: true, writableObjectMode: true, readableObjectMode: true});
        this.accountNumber = null;
        this.accountDescription = null;
        this.statementNumber = null;
    }

    _transform(chunk, encoding, callback) {

        // Account Number : ,1140197096
        if (chunk[0].startsWith('Account Number')) {
            this.accountNumber = chunk[1];
        }

        // Account Description : ,current account
        else if (chunk[0].startsWith('Account Description')) {
            this.accountDescription = chunk[1];
        }

        // Statement Number : ,97,
        else if (chunk[0].startsWith('Statement Number')) {
            this.statementNumber = chunk[1];
            this.push({
                accountNumber: this.accountNumber,
                accountDescription: this.accountDescription,
                statementNumber: this.statementNumber,
                institution: 'NEDBANK',
            });
        }

        callback();
    }
}


module.exports = {
    fnbTransaction: () => {
        return new FNBTransaction()
    },
    nedbankTransaction: () => {
        return new NedbankTransaction()
    },
    fnbStatement: () => {
        return new FNBStatement()
    },
    nedbankStatement: () => {
        return new NedbankStatement()
    },
};