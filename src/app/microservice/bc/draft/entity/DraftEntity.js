module.exports = class DraftEntity {
    constructor(draft) {
        this.validate(draft);
        this.attachment = draft.attachment;
        this.institution = draft.institution;
        this.filename = draft.filename;
        this.createdDate = new Date();
    }

    validate({attachment, institution, filename}) {
        const validFilename = (typeof filename === 'string') && filename.trim().length;
        const validAttachment = (typeof attachment === 'string') && attachment.trim().length;
        const validInstitution = (typeof institution === 'string') && institution.trim().length;
        if (!validFilename) {
            throw Error(`Error creating draft. Incorrect filename`);
        }
        if (!validAttachment) {
            throw Error(`Error creating draft. Incorrect attachment`);
        }
        if (!validInstitution) {
            throw Error(`Error creating draft. Incorrect institution ${institution}`);
        }
    }
};