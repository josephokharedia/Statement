const Statement = require('./Statement');
module.exports = class FNBStatement extends Statement {

    constructor() {
        super();
        this._fromDate = null;
        this._toDate = null;
    }

    process(line) {
        // 2,62295306578,'MR JOSEPH I OKHAREDIA','FNB PREMIER CHEQUE ACCOUNT'
        if (/[2]/.test(line[0]) && /[0-9]+/.test(line[1])) {
            this.accountNumber = line[1];
            this.accountName = line[3];
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

            this.addTransaction(date, description, amount, balance);
        }
    }
};