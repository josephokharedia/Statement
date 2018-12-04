const stream = require('stream');
module.exports = class FNBStatementTransformer extends stream.Transform {
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
            if (!this.accountNumber) {
                throw Error(`FNB statement account number ${this.accountNumber} is not valid`);
            }
            if (!this.accountDescription) {
                throw Error(`FNB statement account description ${this.accountDescription} is not valid`);
            }
        }

        // 3,'Statement Number','From Date','To Date','Opening Balance','Closing Balance','VAT Paid'
        // 3,92,'11 August 2018','12 September 2018',-177.49,-110.71,-22.70
        else if (/[3]/.test(chunk[0]) && /[0-9]+/.test(chunk[1])) {
            this.statementNumber = chunk[1];
            if (!this.statementNumber) {
                throw Error(`FNB statement number ${this.statementNumber} is not valid`);
            }

            this.push({
                accountNumber: this.accountNumber,
                accountDescription: this.accountDescription,
                statementNumber: this.statementNumber,
                institution: 'FNB',
            });
        }

        callback();
    }
};