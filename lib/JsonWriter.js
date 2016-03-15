'use strict';

const _ = require('lodash');
const debug = require('debug');
const runAsyncGen = require('run-async-gen');

function JsonWriter() {
	this._debug = debug('JsonWriter');
	this._stream = null;
	this._stringCache = {};
	this._integerCache = {};
	this._numberCache = {};
}

var p = JsonWriter.prototype;

p._BUF_NULL = new Buffer('null');
p._BUF_TRUE = new Buffer('true');
p._BUF_FALSE = new Buffer('false');
p._BUF_COMMA = new Buffer(',');
p._BUF_COLON = new Buffer(':');
p._BUF_LEFT_ARRAY_BRACKET = new Buffer('[');
p._BUF_RIGHT_ARRAY_BRACKET = new Buffer(']');
p._BUF_LEFT_OBJECT_BRACKET = new Buffer('{');
p._BUF_RIGHT_OBJECT_BRACKET = new Buffer('}');

p.start = function(stream, target, cb) {
	this._debug('start');
	this._stream = stream;
	runAsyncGen(this._writeTarget(target), cb);
};

p._writeTarget = function*(target) {
	this._debug('_writeTarget');
	if (_.isUndefined(target)) {
		return;
	}
	if (_.isNull(target)) {
		yield* this._write(this._BUF_NULL);
		return;
	}
	if (_.isArray(target)) {
		yield* this._writeArray(target);
		return;
	}
	if (_.isObject(target)) {
		yield* this._writeObject(target);
		return;
	}
	if (_.isString(target)) {
		yield* this._writeString(target);
		return;
	}
	if (_.isNumber(target)) {
		if (_.isInteger(target)) {
			yield* this._writeNumber(target, this._integerCache);
			return;
		}
		yield* this._writeNumber(target, this._numberCache);
		return;
	}
	if (_.isBoolean(target)) {
		yield* this._write(target ? this._BUF_TRUE : this._BUF_FALSE);
		return;
	}
	throw new Error('Unsupported type');
};

p._write = function*(token, next) {
	this._debug('_write');
	const stream = this._stream;
	const more = stream.write(token);
	if (!more) {
		yield _.bind(stream.once, stream, 'drain');
	}
};

p._writeObject = function*(target) {
	this._debug('_writeObject');
	yield* this._write(this._BUF_LEFT_OBJECT_BRACKET);
	const names = Object.keys(target);
	for (let i = 0, l = names.length; i < l; i++) {
		if (i !== 0) {
			yield* this._write(this._BUF_COMMA);
		}
		const name = names[i];
		const subTarget = target[name];
		if (_.isUndefined(subTarget)) {
			continue;
		}
		yield* this._writeString(name);
		yield* this._write(this._BUF_COLON);
		yield* this._writeTarget(subTarget);
	}
	yield* this._write(this._BUF_RIGHT_OBJECT_BRACKET);
};

p._writeArray = function*(target) {
	this._debug('_writeArray');
	yield* this._write(this._BUF_LEFT_ARRAY_BRACKET);
	for (let i = 0, l = target.length; i < l; i++) {
		if (i !== 0) {
			yield* this._write(this._BUF_COMMA);
		}
		const subTarget = target[i];
		yield* this._writeTarget(subTarget);
	}
	yield* this._write(this._BUF_RIGHT_ARRAY_BRACKET);
};

p._writeString = function*(target) {
	this._debug('_writeString');
	const cache = this._stringCache;
	let targetAsBuf = cache[target];
	if (targetAsBuf === undefined) {
		const targetAsString = JSON.stringify(target);
		targetAsBuf = new Buffer(targetAsString);
		cache[target] = targetAsBuf;
	}
	yield* this._write(targetAsBuf);
};

p._writeNumber = function*(target, cache) {
	this._debug('_writeNumber');
	const targetAsString = target.toString();
	let targetAsBuf = cache[targetAsString];
	if (targetAsBuf === undefined) {
		targetAsBuf = new Buffer(targetAsString);
		cache[targetAsString] = targetAsBuf;
	}
	yield* this._write(targetAsBuf);
};

module.exports = JsonWriter;
