module.exports = class Statement {
    constructor() {
        if (new.target === Statement) {
            throw new TypeError("Cannot construct StatementParser instances directly");
        }
        this._statement = {
            accountNumber: null,
            accountName: null,
            transactions: []
        };
    }

    get accountNumber() {
        return this._statement.accountNumber;
    }

    set accountNumber(number) {
        number && (this._statement.accountNumber = number);
    }

    get accountName() {
        return this._statement.accountName;
    }

    set accountName(name) {
        name && name.length && (this._statement.accountName = name);
    }

    get statement() {
        return this._statement;
    }

    addTransaction(date, description, amount, balance) {
        let valid = (date && (date instanceof Date) && description && description.length
            && amount && /[-+]?[0-9]+([.][0-9]{2})?/.test(amount) && /[-+]?[0-9]+[.][0-9]{2}/.test(balance));
        if (!valid) throw new Error(`IllegalArgumentException: ${date}, ${description}, ${amount}, ${balance}`);
        this._statement.transactions.push({date, description, amount, balance});
    }

    process(line) {
        throw new Error('UnsupportedOperationException');
    }
};