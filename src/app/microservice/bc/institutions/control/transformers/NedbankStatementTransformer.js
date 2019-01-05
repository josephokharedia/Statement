const stream = require('stream');
module.exports = class NedbankStatementTransformer extends stream.Transform {
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
            if (!this.accountNumber) {
                throw Error(`Nedbank statement account number ${this.accountNumber} is not valid`);
            }

        }

        // Account Description : ,current account
        else if (chunk[0].startsWith('Account Description')) {
            this.accountDescription = chunk[1];
            if (!this.accountDescription) {
                throw Error(`Nedbank statement account description ${this.accountDescription} is not valid`);
            }
        }

        // Statement Number : ,97,
        else if (chunk[0].startsWith('Statement Number')) {
            this.statementNumber = chunk[1];
            if (!this.statementNumber) {
                throw Error(`Nedbank statement number ${this.statementNumber} is not valid`);
            }

            this.push({
                accountNumber: this.accountNumber,
                accountDescription: this.accountDescription,
                statementNumber: this.statementNumber,
                institution: 'NEDBANK',
            });
        }

        callback();
    }
};