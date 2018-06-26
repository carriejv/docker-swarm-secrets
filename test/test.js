'use strict';

let chai = require('chai').use(require('chai-as-promised'));
let should = chai.should();
let dockerSwarmSecrets = require('../index.js');

let testOptions = {
	encoding: 'utf-8',
	parseJSON: true,
	secretsDir: './test/test-secrets'
};

describe('docker-swarm-secrets', function() {

	describe('#readSecrets', function() {

		it('should read secrets', function(done) {
			dockerSwarmSecrets.readSecrets(testOptions).should.be.fulfilled.notify(done);
		});
		it('should read data as strings', function(done) {
			dockerSwarmSecrets.readSecrets(testOptions)
			.then( (res) => {
				if(res.text === 'This is a string of utf-8 text.') {
					done();
				}
				else {
					done(new Error('Text not properly parsed.'));
				}
			}).catch( (err) => {
				done(err);
			});
		});
		it('should parse valid json', function(done) {
			dockerSwarmSecrets.readSecrets(testOptions)
			.then( (res) => {
				if(res.json.this === 'is' && res.json.valid === 'json') {
					done();
				}
				else {
					done(new Error('JSON not properly parsed.'));
				}
			}).catch( (err) => {
				done(err);
			});
		});
		it('should work with a callback function', function(done) {
			dockerSwarmSecrets.readSecrets(testOptions, (err, res) => {
				done(err);
			});
		});

	});

	describe('#readSecretsSync', function() {

		it('should read secrets', function() {
			dockerSwarmSecrets.readSecretsSync(testOptions).should.not.equal(false);
		});
		it('should read data as strings', function() {
			dockerSwarmSecrets.readSecretsSync(testOptions).text.should.equal('This is a string of utf-8 text.');
		});
		it('should parse valid json', function() {
			dockerSwarmSecrets.readSecretsSync(testOptions).json.this.should.equal('is');
			dockerSwarmSecrets.readSecretsSync(testOptions).json.valid.should.equal('json');
		});

	});

	describe('#readSecret', function() {

		it('should read a secret', function(done) {
			dockerSwarmSecrets.readSecret('text', testOptions).should.be.fulfilled.notify(done);
		});
		it('should read data as a string', function(done) {
			dockerSwarmSecrets.readSecret('text', testOptions)
			.then( (res) => {
				if(res === 'This is a string of utf-8 text.') {
					done();
				}
				else {
					done(new Error('Text not properly parsed.'));
				}
			}).catch( (err) => {
				done(err);
			});
		});
		it('should parse valid json', function(done) {
			dockerSwarmSecrets.readSecret('json', testOptions)
			.then( (res) => {
				if(res.this === 'is' && res.valid === 'json') {
					done();
				}
				else {
					done(new Error('JSON not properly parsed.'));
				}
			}).catch( (err) => {
				done(err);
			});
		});
		it('should work with a callback function', function(done) {
			dockerSwarmSecrets.readSecret('text', testOptions, (err, res) => {
				done(err);
			});
		});

	});

	describe('#readSecretSync', function() {

		it('should read a secret', function() {
			dockerSwarmSecrets.readSecretSync('text', testOptions).should.not.equal(false);
		});
		it('should read data as a string', function() {
			dockerSwarmSecrets.readSecretSync('text', testOptions).should.equal('This is a string of utf-8 text.');
		});
		it('should parse valid json', function() {
			dockerSwarmSecrets.readSecretSync('json', testOptions).this.should.equal('is');
			dockerSwarmSecrets.readSecretSync('json', testOptions).valid.should.equal('json');
		});

	});

});