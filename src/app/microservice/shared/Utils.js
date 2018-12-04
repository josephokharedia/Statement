const ObjectId = require('mongodb').ObjectId;
const _ = require('lodash');

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function handleError(err, res, operation, status) {
    console.log('error occurred!', err.stack);
    const msg = ((operation && `Failed to ${operation}. `) || ``).concat(`Unexpected error ${err} occurred!`);
    res && res.status(status || 500).json({msg}).end();
}

function toObjectId(value) {
    const paddedValue = _.padStart(value, 24, '0');
    return ObjectId(paddedValue);
}

module.exports = {escapeRegExp, handleError, toObjectId};