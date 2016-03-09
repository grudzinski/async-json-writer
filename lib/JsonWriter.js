'use strict';

const _ = require('lodash');
const debug = require('debug');
const runAsyncGen = require('run-async-gen');

function JsonWriter() {
	this._debug = debug('JsonWriter');
	this._stream = null;
}

var p = JsonWriter.prototype;

p.start = function(stream, target, cb) {
	this._debug('start');
	this._stream = stream;
	runAsyncGen(this._writeTarget(target), cb);
};

p._writeTarget = function*(target) {
	this._debug('_writeTarget');
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
		yield* this._writeNumber(target);
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
	yield* this._write('{');
	const names = Object.keys(target);
	for (let i = 0, l = names.length; i < l; i++) {
		if (i !== 0) {
			yield* this._write(',');
		}
		const name = names[i];
		yield* this._writeString(name);
		yield* this._write(':');
		const subTarget = target[name];
		yield* this._writeTarget(subTarget);
	}
	yield* this._write('}');
};

p._writeArray = function*(target) {
	this._debug('_writeArray');
	yield* this._write('[');
	for (let i = 0, l = target.length; i < l; i++) {
		if (i !== 0) {
			yield* this._write(',');
		}
		const subTarget = target[i];
		yield* this._writeTarget(subTarget);
	}
	yield* this._write(']');
};

p._writeString = function*(target) {
	this._debug('_writeString');
	const targetAsString = JSON.stringify(target);
	yield* this._write(targetAsString);
};

p._writeNumber = function*(target) {
	this._debug('_writeNumber');
	const targetAsString = target.toString();
	yield* this._write(targetAsString);
};

module.exports = JsonWriter;
