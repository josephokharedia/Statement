module.exports = class CategoryTo {
    constructor({_id, name, tags, regex}) {
        this.id = _id;
        this.name = name;
        this.tags = tags;
        this.regex = regex;
    }
};