const {toObjectId} = require('../../../microservice/shared/Utils');
module.exports = [
    {
        _id: toObjectId(1),
        accountNumber: '100',
        accountDescription: 'Test Account',
        statementNumber: '01',
        institution: 'Test Bank',
        hashCode: '1',
        raw: null,
    },
    {
        _id: toObjectId(2),
        accountNumber: '100',
        accountDescription: 'Test Account',
        statementNumber: '02',
        institution: 'Test Bank',
        hashCode: '2',
        raw: null,
    }
];