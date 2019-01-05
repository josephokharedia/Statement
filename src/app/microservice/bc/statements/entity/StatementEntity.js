const {hashStatement} = require('../../../shared/Utils');
module.exports = class StatementEntity {
    constructor(statement) {
        this.validate(statement);
        this.accountNumber = statement.accountNumber;
        this.accountDescription = statement.accountDescription;
        this.statementNumber = statement.statementNumber;
        this.institution = statement.institution;
        this.attachment = statement.attachment;

        this.hashCode = hashStatement(this);
    }

    validate({accountNumber, statementNumber, accountDescription, institution, attachment}) {
        const validAccountNumber = (typeof (accountNumber) === 'string') && accountNumber.trim().length;
        const validAccountDescription = (typeof (accountDescription) === 'string') && accountDescription.trim().length;
        const validStatementNumber = (typeof (statementNumber) === 'string') && statementNumber.trim().length;
        const validInstitution = (typeof (institution) === 'string') && institution.trim().length;
        if (!validAccountNumber) {
            throw Error(`Error creating Statement. Incorrect account number`);
        }
        if (!validAccountDescription) {
            throw Error(`Error creating Statement. Incorrect account description`);
        }
        if (!validStatementNumber) {
            throw Error(`Error creating Statement. Incorrect statement number`);
        }
        if (!validInstitution) {
            throw Error(`Error creating Statement. Incorrect Institution`);
        }
    }
};