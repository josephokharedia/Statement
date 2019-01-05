/*
 * Draft Business adapter
 * Receives an instruction to create draft statement
 */

const instBa = require('../../institutions/control/InstitutionsBa');
const draftEsi = require('../integration/DraftsEsi');
const DraftEntity = require('../entity/DraftEntity');
const {unwrapError, toObjectId, hashStatement, hashTransaction} = require('../../../shared/Utils');
const txBa = require('../../transactions/control/TransactionsBa');
const stmtBa = require('../../statements/control/StatementsBa');
const parse = require('csv-parse');
const hash = require('object-hash');
const es = require("event-stream");
const {InstitutionAdapter} = require('../../institutions/control/InstitutionsBa');
const DraftTo = require('../control/transferobject/DraftTo');
const fs = require('fs');

async function createDraft({files, fields}) {
    try {
        let attachment = null;
        const file = files['file'];
        const institution = fields['institution'];
        if (!file || !file.hasOwnProperty('path') || !file.hasOwnProperty('name')) {
            throw Error(`A valid file is required`);
        }
        if (!institution || !institution.length) {
            throw Error(`A valid institution is required`);
        }

        const filename = file.name;
        const readFile = () => new Promise((res, rej) => {
            fs.readFile(file.path, {encoding: 'utf-8'}, (err, data) => {
                if (err) rej(err);
                res(data);
            });
        });

        attachment = await readFile();

        if (!attachment) {
            throw Error(`A valid file is required`);
        }

        const draftEntity = new DraftEntity({attachment, institution, filename});

        // validate that institution is supported
        const institutions = await instBa.getInstitutions();
        const validInstitution = institutions.map(i => i.name.toUpperCase()).includes(institution.toUpperCase());
        if (!validInstitution) {
            throw Error(`Institution ${institution} not supported`);
        }

        const {statement, transactions} = await _getStatementAndTransactionsFromAttachment(attachment, institution);

        const savedDbDraft = await draftEsi.saveDraft(draftEntity);
        return new DraftTo(savedDbDraft, statement, transactions);
    } catch (e) {
        return unwrapError(`Failed to create statement draft`, e);
    }
}


async function getDrafts() {
    try {
        const savedDbDrafts = await draftEsi.getDrafts([]);
        savedDbDrafts.map(d => d.createdDate).sort((a, b) => b.getTime() - a.getTime());
        const drafts = [];
        for (let dbDraft of savedDbDrafts) {
            const {statement, transactions} =
                await _getStatementAndTransactionsFromAttachment(dbDraft.attachment, dbDraft.institution);
            drafts.push(new DraftTo(dbDraft, statement, transactions));
        }
        return drafts;
    } catch (e) {
        return unwrapError(`Failed to get all Drafts`, e);
    }
}

async function getDraft({draftId}) {
    try {
        if (!draftId) {
            throw Error(`DraftId cannot be empty`);
        }
        const savedDbDraft = await _getDbDraftById(draftId);
        const {statement, transactions} =
            await _getStatementAndTransactionsFromAttachment(savedDbDraft.attachment, savedDbDraft.institution);
        return new DraftTo(savedDbDraft, statement, transactions);
    } catch (e) {
        return unwrapError(`Failed to get Draft with id:${draftId}`, e);
    }
}

async function deleteDraft({draftId}) {
    try {
        const {_id} = await draftEsi.deleteDraft(toObjectId(draftId));
        return _id;
    } catch (e) {
        return unwrapError(`Failed to delete draft with id:${draftId}`, e);
    }
}

async function approveDraft({draftId}) {
    try {
        if (!draftId) {
            throw Error(`DraftId cannot be empty`);
        }

        const {attachment, institution} = await _getDbDraftById(draftId);
        const {statement, transactions} = await _getStatementAndTransactionsFromAttachment(attachment, institution);

        const createdStatement = await stmtBa.createStatement(statement);

        await txBa.createTransactions(transactions, createdStatement.id);
        await deleteDraft({draftId});
        return createdStatement;

    } catch (e) {
        return unwrapError(`Failed to get Draft with id:${draftId}`, e);
    }
}

async function _getDbDraftById(draftId) {
    const drafts = await draftEsi.getDrafts([{$match: {_id: toObjectId(draftId)}}]);
    if (!drafts.length) {
        throw Error(`No draft found with id:${draftId}`);
    }
    return drafts[0];
}

async function _getStatementAndTransactionsFromAttachment(attachment, institution) {
    const statement = await _statementFromCsv(attachment, institution);
    const transactions = await _transactionsFromCsv(attachment, institution);

    // check if statement exists already in db, if so mark as duplicate
    const dbStatements = await stmtBa.getStatements({hashCode: hashStatement(statement)});
    if (dbStatements.length) {
        statement.duplicate = true;
    }

    // check if transaction exists already in db, if so mark as duplicate
    for (let t of transactions) {
        const {data: dbTransactions} = await txBa.getTransactions({hashCode: hashTransaction(t)});
        if (dbTransactions.length) {
            t.duplicate = true;
        }
    }
    return {statement, transactions};
}

async function _statementFromCsv(attachment, institution) {
    const transformer = new InstitutionAdapter(institution).getStatementAdapter();
    return new Promise((resolve, reject) => {
        let statement = null;
        // setup the csv parser breakup a comma separated line into an array of values
        const csvParser = parse({relax_column_count: true, ltrim: true, rtrim: true});
        csvParser.on('error', (e) => reject(e));
        const innerStream = es.readArray([attachment]) // read the csv into an event stream
            .pipe(es.split(/(\r?\n)/)) // break up the csv by new line
            .pipe(csvParser) // feed each line into the csv parser to get an array of values
            .pipe(transformer) // feed the line values into a statement transformer that will collate the values from
            // each line and spit out a statement when complete
            .pipe(es.map((_statement, callback) => {
                _statement.attachment = attachment; // set attachment of statement as the attachment csv file
                statement = _statement;
                callback();
            }));
        innerStream.on('end', () => {
            if (statement == null) {
                reject(Error(`Failed to transform csv to statement`));
            }
            resolve(statement);
        });

        innerStream.on('error', (e) => {
            reject(e);
        })
    });
}

async function _transactionsFromCsv(csv, institution) {
    const transformer = new InstitutionAdapter(institution).getTransactionAdapter();
    return new Promise((resolve) => {
        const transactions = []; // array to hold all transactions produced from the statement
        // setup the csv parser breakup a comma separated line into an array of values
        const csvParser = parse({relax_column_count: true, ltrim: true, rtrim: true});
        const innerStream = es.readArray([csv]) // read the csv into an event stream
            .pipe(es.split(/(\r?\n)/)) // break up the csv by new line
            .pipe(csvParser) // feed each line into the csv parser to get an array of values
            .pipe(transformer) // feed the line values into a transaction transformer that will collate the values from
            // each line and spit out a transaction when complete
            .pipe(es.map((_transaction, callback) => {
                transactions.push(_transaction);
                callback();
            }));
        innerStream.on('end', () => {
            if (transactions.length === 0) throw Error(`No Transactions created from statement`);
            resolve(transactions);
        });
    });
}

module.exports = {getDrafts, getDraft, createDraft, deleteDraft, approveDraft};