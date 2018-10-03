const hash = require('object-hash');
const {Readable} = require('stream');
const readLine = require('readline');
const parse = require('csv-parse');
const {Observable} = require('rxjs');
const {mergeAll} = require('rxjs/operators');


const transactionsObservable = (csv, bank) => {
    return Observable.create(observer => {

        let statementInstance = null;
        switch (bank) {
            case 'fnb':
                statementInstance = Statement.fnbInstance();
                break;
            case 'nedbank':
                statementInstance = Statement.nedbankInstance();
                break;
            default:
                statementInstance = Statement.fnbInstance();
        }

        this._parser = parse({
            relax_column_count: true,
            ltrim: true,
            rtrim: true
        });
        const stream = new Readable();
        stream.push(csv);
        stream.push(null);
        this._rl = readLine.createInterface({input: stream});
        this._rl.on('close', () => this._parser.end());

        this._rl.on('line', (line) => {
            this._parser.write(line);
            this._parser.write('\n');
        });
        this._parser.on('data', (chunk) => {
            if (chunk && (chunk instanceof Array) && chunk.length) {
                statementInstance.process(chunk);
            }
        });
        this._parser.on('end', () => {
            observer.next(statementInstance.transactions);
            observer.complete();
        });
    }).pipe(mergeAll());
};

const fnbTransactionsObservable = (csv) => {
    return transactionsObservable(csv, 'fnb');
};

const nedbankTransactionsObservable = (csv) => {
    return transactionsObservable(csv, 'nedbank');
};

class Statement {
    constructor() {
        if (new.target === Statement) {
            throw new TypeError("Cannot construct StatementParser instances directly");
        }
        this._transactions = [];
    }

    get transactions() {
        return this._transactions;
    }

    static fnbInstance() {
        return new FNBStatement();
    }

    static nedbankInstance(csv) {
        return new NedbankStatement();
    }

    addTransaction(accountNo, date, description, amount, balance) {
        let valid = accountNo && accountNo.length && (date && (date instanceof Date) && description && description.length
            && amount && /[-+]?[0-9]+([.][0-9]{2})?/.test(amount) && /[-+]?[0-9]+[.][0-9]{2}/.test(balance));
        if (!valid) throw new Error(`IllegalArgumentException: ${date}, ${description}, ${amount}, ${balance}`);
        let transaction = {accountNo, date, description, amount, balance};
        transaction.hash = hash.sha1(transaction);
        this._transactions.push(transaction);
    }

    process(line) {
        throw new Error('UnsupportedOperationException');
    }
}

class NedbankStatement extends Statement {

    constructor() {
        super();
        this._accountNumber = null;
    }

    process(line) {
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
            this.addTransaction(this._accountNumber, date, description, amount, balance);
        }
    }
}

class FNBStatement extends Statement {

    constructor(csv) {
        super(csv);
        this._fromDate = null;
        this._toDate = null;
        this._accountNumber = null;
    }

    process(line) {
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
            let description = line[3].trim().concat(`, ${line[4].trim()}`).concat(`, ${line[4].trim()}`);
            let amount = line[6];
            let balance = line[7];
            let date = new Date(line[2]);

            if (date.getMonth() < this._fromDate.getMonth()) {
                date.setFullYear(this._toDate.getFullYear());
            } else {
                date.setFullYear(this._fromDate.getFullYear());
            }
            this.addTransaction(this._accountNumber, date, description, amount, balance);
        }
    }
}

module.exports = {fnb: fnbTransactionsObservable, nedbank: nedbankTransactionsObservable};