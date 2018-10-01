const Statement = require('./Statement');
module.exports = class NedbankStatement extends Statement {

    constructor() {
        super();
    }

    process(line) {

        // Account Number : ,1140197096
        if (line[0].toLowerCase().trim().startsWith('account number')) {
            this.accountNumber = line[1];
            this.accountName = line[3];
        }
        // Account Description : ,current account
        if (line[0].toLowerCase().trim().startsWith('account description')) {
            this.accountName = line[1];
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

            this.addTransaction(date, description, amount, balance);
        }
    }
};