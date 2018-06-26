'use strict';

/**
 * Module Dependencies
 */
let fs = require('fs');
let path = require('path');

/**
 * Constants
 */
const DEFAULT_ENCODING = 'utf-8';
const DEFAULT_PARSE_JSON = true;
const DEFAULT_SECRETS_DIR = '/run/secrets';

/**
 * Reads all Docker secrets asynchronously into an object, using secret names as keys. Valid JSON is parsed as such, unless set otherwise in options. All other data is read as a string.
 *
 * @param {Object} options - An object containing options for the function.
 * @param {function} [callback] - A callback function, accepting an error (if any) and an object containing the secrets as parameters. If none is provided, readSecrets returns a Promise object instead.
 */
let readSecrets = function(options, callback) {
	let opts = {
		encoding: (options && options.encoding ? options.encoding : DEFAULT_ENCODING),
		parseJSON: (options && options.parseJSON !== DEFAULT_PARSE_JSON ? options.parseJSON : DEFAULT_PARSE_JSON),
		secretsDir: (options && options.secretsDir ? options.secretsDir : DEFAULT_SECRETS_DIR)
	};
	let doReadSecrets = function() {
		let promise = new Promise( (resolve, reject) => {
			fs.readdir(opts.secretsDir, (err, files) => {
				if(err) {
					reject(err);
				}
				let res = {};
				let checkCompletion = function() {
					for(let v of files) {
						if(!res[v]) {
							return false;
						}
					}
					resolve(res);
				};
				for(let v of files) {
					fs.readFile(path.join(opts.secretsDir, v), opts.encoding, (err, data) => {
						if(err) {
							reject(err);
						}
						data = data.toString();
						if(opts.parseJSON) {
							let json;
							try {
								json = JSON.parse(data);
							}
							catch(e) {
								json = data;
							}
							res[v] = json;
						}
						else {
							res[v] = data;
						}
						checkCompletion();
					});
				}
			});
		});
		return promise;
	};
	if(callback && typeof callback === 'function') {
		doReadSecrets()
		.then( (res) => {
			callback(false, res);
		}).catch( (err) => {
			callback(err);
		});
	}
	else {
		return doReadSecrets();
	}
};

/**
 * Reads all Docker secrets synchronously into an Object, using secret names as keys. Valid JSON is parsed as such, unless set otherwise in options. All other data is read as a string.
 *
 * @param {Object} options - An object containing options for the function.
 */
let readSecretsSync = function(options) {
	let opts = {
		encoding: (options && options.encoding ? options.encoding : DEFAULT_ENCODING),
		parseJSON: (options && options.parseJSON !== DEFAULT_PARSE_JSON ? options.parseJSON : DEFAULT_PARSE_JSON),
		secretsDir: (options && options.secretsDir ? options.secretsDir : DEFAULT_SECRETS_DIR)
	};
	let files = fs.readdirSync(opts.secretsDir);
	let res = {};
	for(let v of files) {
		let data = fs.readFileSync(path.join(opts.secretsDir, v), opts.encoding).toString();
		if(opts.parseJSON) {
			let json;
			try {
				json = JSON.parse(data);
			}
			catch(e) {
				json = data;
			}
			res[v] = json;
		}
		else {
			res[v] = data;
		}
	}
	return res;
};

/**
 * Reads a single Docker secret asynchronously. Valid JSON is parsed as such, unless set otherwise in options. All other data is read as a string.
 *
 * @param {string} name - The name of the Docker secret.
 * @param {Object} options - An object containing options for the function.
 * @param {function} [callback] - A callback function, accepting an error (if any) and an object containing the secrets as parameters. If none is provided, readSecrets returns a Promise object instead.
 */
let readSecret = function(name, options, callback) {
	let opts = {
		encoding: (options && options.encoding ? options.encoding : DEFAULT_ENCODING),
		parseJSON: (options && options.parseJSON !== DEFAULT_PARSE_JSON ? options.parseJSON : DEFAULT_PARSE_JSON),
		secretsDir: (options && options.secretsDir ? options.secretsDir : DEFAULT_SECRETS_DIR)
	};
	let doReadSecret = function() {
		let promise = new Promise( (resolve, reject) => {
			fs.readFile(path.join(opts.secretsDir, name), opts.encoding, (err, data) => {
				if(err) {
					reject(err);
				}
				data = data.toString();
				if(opts.parseJSON) {
					let json;
					try {
						json = JSON.parse(data);
					}
					catch(e) {
						json = data;
					}
					resolve(json);
				}
				else {
					resolve(data);
				}
			});
		});
		return promise;
	};
	if(callback && typeof callback === 'function') {
		doReadSecret()
		.then( (res) => {
			callback(false, res);
		}).catch( (err) => {
			callback(err);
		});
	}
	else {
		return doReadSecret();
	}
};

/**
 * Reads a single Docker secrets synchronously. Valid JSON is parsed as such, unless set otherwise in options. All other data is read as a string.
 *
 * @param {string} name - The name of the Docker secret.
 * @param {Object} options - An object containing options for the function.
 */
let readSecretSync = function(name, options) {
	let opts = {
		encoding: (options && options.encoding ? options.encoding : DEFAULT_ENCODING),
		parseJSON: (options && options.parseJSON !== DEFAULT_PARSE_JSON ? options.parseJSON : DEFAULT_PARSE_JSON),
		secretsDir: (options && options.secretsDir ? options.secretsDir : DEFAULT_SECRETS_DIR)
	};
	let data = fs.readFileSync(path.join(opts.secretsDir, name), opts.encoding).toString();
	let res;
	if(opts.parseJSON) {
		let json;
		try {
			json = JSON.parse(data);
		}
		catch(e) {
			json = data;
		}
		res = json;
	}
	else {
		res = data;
	}
	return res;
};

module.exports = {
	readSecrets: readSecrets,
	readSecretsSync: readSecretsSync,
	readSecret: readSecret,
	readSecretSync: readSecretSync
};