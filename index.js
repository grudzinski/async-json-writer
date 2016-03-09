'use strict';

const JsonWriter = require('./lib/JsonWriter.js');

module.exports = function(stream, target, cb) {
	const writer = new JsonWriter();
	writer.start(stream, target, cb);
}
