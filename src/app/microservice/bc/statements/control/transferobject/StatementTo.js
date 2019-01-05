/**
 * openingBalance:2651.62
 closingBalance:-133.14
 fromDate:2017-11-14 00:00:01.000
 toDate:2017-12-12 00:00:01.000
 totalCredit:1998
 totalDebit:-3747.2599999999998
 _id:5be35b1e8797b5015dc16cc8
 accountNumber:"62295306578"
 accountDescription:"'FNB PREMIER CHEQUE ACCOUNT'"
 institution:"FNB"
 statementNumber:"83"
 hashCode:"5cea0ec1c28ddc9ce30b321afb1d820234ca9926"
 attachment:"2,62295306578,'MR JOSEPH I OKHAREDIA','FNB PREMIER CHEQUE ACCOUNT'
 3
 ..."
 * @type {module.StatementTo}
 */

module.exports = class StatementTo {
    constructor(statement) {
        this.id = statement._id;
        this.accountNumber = statement.accountNumber;
        this.accountDescription = statement.accountDescription;
        this.statementNumber = statement.statementNumber;
        this.hashCode = statement.hashCode;
        this.openingBalance = statement.openingBalance;
        this.closingBalance = statement.closingBalance;
        this.totalCredit = statement.totalCredit;
        this.totalDebit = statement.totalDebit;
        this.fromDate = statement.fromDate;
        this.toDate = statement.toDate;
        this.institution = statement.institution;
    }
};