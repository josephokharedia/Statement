const {expect} = require('chai');
const moment = require('moment');
const draftsBa = require('../microservice/bc/draft/control/DraftsBa');
const txBa = require('../microservice/bc/transactions/control/TransactionsBa');
const {toObjectId} = require('../microservice/shared/Utils');
const createTestDatabase = require('./CreateTestDatabase.spec');

describe('Get drafts', function () {
    beforeEach(createTestDatabase);

    it('should get draft successfully', async function () {
        const draftId = 1;
        const draft = await draftsBa.getDraft({draftId});

        const expectedDraft = {
            id: toObjectId(1),
            institution: 'FNB',
            filename: 'File1.csv',
            statement: {
                accountNumber: '123456',
                accountDescription: 'NEW DRAFT STATEMENT',
                statementNumber: '01',
                fromDate: moment.utc('2018-01-01').toDate(),
                toDate: moment.utc('2018-02-01').toDate()
            },
            transactions: [
                {
                    date: moment.utc('2018-01-01').toDate(),
                    description: 'Test Statement, Transaction 01',
                    amount: 100.00,
                    balance: 1000.00,
                },
                {
                    date: moment.utc('2018-01-02').toDate(),
                    description: 'Test Statement, Transaction 02',
                    amount: -200.00,
                    balance: 1000.00
                },
                {
                    date: moment.utc('2018-02-01').toDate(),
                    description: 'Test Statement, Transaction 03',
                    amount: 300.00,
                    balance: -1000.00
                }
            ]
        };
        expect(draft).to.eql(expectedDraft);
    });

    it('should get drafts with statement marked as existing and some transactions marked as existing', async function () {
        const draftId = 2;
        const draft = await draftsBa.getDraft({draftId});
        expect(draft).to.have.deep.nested.property('statement.duplicate', true);
        expect(draft.transactions).to.have.lengthOf(3);
        expect(draft).to.not.have.deep.nested.property('transactions.0.duplicate');
        expect(draft).to.have.deep.nested.property('transactions.1.duplicate', true);
        expect(draft).to.have.deep.nested.property('transactions.2.duplicate', true);
    })
});

describe('Delete draft', function () {
    beforeEach(createTestDatabase);

    it('should delete draft successfully', async function () {
        const draftId = 1;
        await draftsBa.deleteDraft({draftId});
        const {error} = await draftsBa.getDraft({draftId});
        expect(error).to.have.property('summary');
    })
});


describe('Create draft', function () {
    beforeEach(createTestDatabase);

    it('should create draft successfully', async function () {
        const file = {path: `${__dirname}/testdata/upload.csv`, name: 'upload.csv'};
        const institution = 'FNB';
        const req = {files: {file}, fields: {institution}};
        const draft = await draftsBa.createDraft(req);
        const draftId = draft.id;
        const savedDraft = await draftsBa.getDraft({draftId});
        expect(savedDraft).to.have.property('id').to.eql(draftId);
        expect(savedDraft).to.have.property('institution', 'FNB');

        const expectedDraft = {
            id: draftId,
            institution: 'FNB',
            filename: 'upload.csv',
            statement: {
                accountNumber: '000000',
                accountDescription: 'NEW DRAFT STATEMENT',
                statementNumber: '01',
                fromDate: moment.utc('2018-01-01').toDate(),
                toDate: moment.utc('2018-01-03').toDate(),
            },
            transactions: [
                {
                    date: moment.utc('2018-01-01').toDate(),
                    description: 'Draft transaction 1',
                    amount: 100.00,
                    balance: 1000.00,
                },
                {
                    date: moment.utc('2018-01-02').toDate(),
                    description: 'Draft transaction 2',
                    amount: -200.00,
                    balance: 1000.00
                },
                {
                    date: moment.utc('2018-01-03').toDate(),
                    description: 'Draft transaction 3',
                    amount: 300.00,
                    balance: -1000.00
                }
            ]
        };
        expect(draft).to.eql(expectedDraft);
    });

    it('should not create draft with invalid csv', async function () {
        const attachment = `
        *,000000,MR JOE SOAP,NEW DRAFT STATEMENT\n
        *,01,'01 January 2018', '01 February 2019'\n
        5,1,'01 Jan',"Draft transaction 1","","",100.00,1000.00,\n
        5,2,'02 Jan',"Draft transaction 2","","",-200.00,1000.00,\n
        5,3,'03 Jan',"Draft transaction 3","","",300.00,-1000.00,\n
        `;
        const institution = 'FNB';
        const filename = 'File3.csv';
        const {error} = await draftsBa.createDraft({attachment, institution, filename});
        expect(error).to.have.property('summary');
    });
});

describe('Approve draft', function () {
    beforeEach(createTestDatabase);

    it('should approve draft successfully', async function () {

        const draftId = 1;
        const statement = await draftsBa.approveDraft({draftId});
        expect(statement).to.have.property('id');

        const queryOptions = {statement: statement.id};
        const {count} = await txBa.getTransactions(queryOptions);
        expect(count).to.equal(3);

        // Expect the draft to be deleted after successful approval
        const {error} = await draftsBa.getDraft({draftId});
        expect(error).to.have.property('summary');
    });
});