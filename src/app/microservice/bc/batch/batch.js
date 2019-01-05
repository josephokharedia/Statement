const attachments$ = require('./attachments');
const draftsBa = require('../draft/control/DraftsBa');

const institution = 'FNB';
attachments$('FNB Cheque Statements')
    .subscribe(async attachment => {
            const createdDraft = await draftsBa.createDraft({attachment, institution});
            await draftsBa.approveDraft({draftId: createdDraft.id});
        },
        (e) => console.log(`Error occurred`, e));