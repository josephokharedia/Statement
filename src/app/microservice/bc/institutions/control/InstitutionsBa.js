const NedbankStatement = require('../control/transformers/NedbankStatementTransformer');
const FNBStatement = require('../control/transformers/FNBStatementTransformer');
const NedbankTransaction = require('../control/transformers/NedbankTransactionTransformer');
const FNBTransaction = require('../control/transformers/FNBTransactionTransformer');
const {unwrapError} = require('../../../shared/Utils');
const instEsi = require('../integration/InstitutionsEsi');
const InstitutionTo = require('../control/transferobject/InstitutionTo');

async function getInstitutions() {
    try {
        return (await instEsi.getInstitutions()).map(i => new InstitutionTo(i));
    } catch (e) {
        return unwrapError(`Failed to get institutions`, e);
    }
}

function _getStatementAdapter(institution) {
    switch (institution.toLowerCase()) {
        case 'nedbank':
            return new NedbankStatement();
        case 'fnb':
            return new FNBStatement();
        default:
            throw Error(`No statement adapter found for institution ${institution}`);
    }
}

function _getTransactionAdapter(institution) {
    switch (institution.toLowerCase()) {
        case 'nedbank':
            return new NedbankTransaction();
        case 'fnb':
            return new FNBTransaction();
        default:
            throw Error(`No transaction adapter found for institution ${institution}`);
    }
}

class InstitutionAdapter {
    constructor(institution) {
        this.institution = institution;
    }

    getStatementAdapter() {
        return _getStatementAdapter(this.institution);
    }

    getTransactionAdapter() {
        return _getTransactionAdapter(this.institution)
    }
}


module.exports = {InstitutionAdapter, getInstitutions};