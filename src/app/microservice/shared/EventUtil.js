/*
 * Event emitter for the Application
 * Produces an event emitter to emit events and listen for events
 */
const EventEmitter = require('events');

const eventEmitter = new EventEmitter();
const on = function on(eventName, callback) {
    eventEmitter.on(eventName, callback);
};
const raise = function raise(eventName, eventObject) {
    //TODO: Get it to work on setImmediate. Event logic is executed before response is sent to agent
    process.nextTick(() => eventEmitter.emit(eventName, eventObject));
};
module.exports = {raise, on};
