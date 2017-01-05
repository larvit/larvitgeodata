'use strict';

const	assert	= require('assert'),
	log	= require('winston'),
	db	= require('larvitdb'),
	fs	= require('fs');

let geoData;

// Set up winston
log.remove(log.transports.Console);
log.add(log.transports.Console, {
	'level':	'warn',
	'colorize':	true,
	'timestamp':	true,
	'json':	false
});

// Make sure the database is set up
before(function(done) {
	let confFile;

	// Let this test take some time
	this.timeout(60000);
	this.slow(3000);

	// Check for empty db
	function checkTables() {
		db.query('SHOW TABLES', function(err, rows) {
			if (err) {
				log.error(err);
				process.exit(1);
			}

			if (rows.length) {
				log.error('Database is not empty. To make a test, you must supply an empty database!');
				process.exit(1);
			}

			geoData = require(__dirname + '/../index.js');
			geoData.ready(done);
		});
	}

	function runDbSetup(confFile) {
		log.verbose('DB config: ' + JSON.stringify(require(confFile)));

		db.setup(require(confFile), function(err) {
			if (err) throw err;

			checkTables();
		});
	}

	if (process.argv[3] === undefined) {
		confFile = __dirname + '/../config/db_test.json';
	} else {
		confFile = process.argv[3].split('=')[1];
	}

	log.verbose('DB config file: "' + confFile + '"');

	fs.stat(confFile, function(err) {
		const altConfFile = __dirname + '/../config/' + confFile;

		if (err) {
			log.info('Failed to find config file "' + confFile + '", retrying with "' + altConfFile + '"');

			fs.stat(altConfFile, function(err) {
				if (err) {
					assert( ! err, 'fs.stat failed: ' + err.message);
				}

				if ( ! err) {
					runDbSetup(altConfFile);
				}
			});
		} else {
			runDbSetup(confFile);
		}
	});
});

// Tear down the database
after(function(done) {
	
	db.removeAllTables(done);
});

describe('Check database for existing stuff', function() {
	it('Check for Sweden', function(done) {
		db.query('SELECT * FROM geo_territories WHERE iso3166_1_alpha_2 = \'SE\'', function(err, rows) {
			if (err) throw err;
			assert(rows.length === 1, 'There should be exactly one row');
			assert(rows[0].iso3166_1_num === 752, 'Swedens numeric code is 752');

			done();
		});
	});

	it('Check for Swedish language label', function(done) {
		db.query('SELECT * FROM geo_langLabels WHERE langIso639_3 = \'swe\' AND labelIso639_3 = \'swe\'', function(err, rows) {
			if (err) throw err;
			assert(rows.length === 1, 'There should be exactly one row');
			assert(rows[0].label === 'svenska', 'The correct label should be "svenska", but is "' + rows[0].label + '"');

			done();
		});
	});

	it('Check for Swedish territory label', function(done) {
		db.query('SELECT * FROM geo_territoryLabels WHERE labelIso639_3 = \'swe\' AND terIso3166_1_alpha_2 = \'SE\'', function(err, rows) {
			if (err) throw err;
			assert.deepEqual(rows.length, 1);
			assert(rows[0].label === 'Sverige', 'The correct label should be "Sverige", but is "' + rows[0].label + '"');

			done();
		});
	});
});

describe('Language functions', function() {
	it('Getting language labels, basic', function(done) {
		geoData.getLanguages(function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 140);

			assert.deepEqual(result[0].iso639_1, 'ab');
			assert.deepEqual(result[0].label, 'Abkhazian');

			assert.deepEqual(result[69].iso639_3, 'lit');
			assert.deepEqual(result[69].label, 'Lithuanian');

			assert.deepEqual(result[30].iso639_3, 'eng');
			assert.deepEqual(result[30].iso639_1, 'en');
			assert.deepEqual(result[30].label, 'English');

			assert.deepEqual(result[112].iso639_3, 'swe');
			assert.deepEqual(result[112].iso639_1, 'sv');
			assert.deepEqual(result[112].label, 'Swedish');

			done();
		});
	});

	it('Getting all languages', function(done) {
		geoData.getLanguages({'type': false, 'scope': false, 'gotIso639_1': 'all'}, function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 8368);

			assert.deepEqual(result[0].iso639_3, 'aaa');
			assert.deepEqual(result[0].iso639_1, null);
			assert.deepEqual(result[0].scope, 'individual');
			assert.deepEqual(result[0].type, 'living');
			assert.deepEqual(result[0].label, null);

			assert.deepEqual(result[8367].iso639_3, 'zun');
			assert.deepEqual(result[8367].iso639_1, null);
			assert.deepEqual(result[8367].scope, 'individual');
			assert.deepEqual(result[8367].type, 'living');
			assert.deepEqual(result[8367].label, 'Zuni');

			done();
		});
	});

	it('Getting all swedish language labels', function(done) {
		geoData.labelLang = 'swe';

		geoData.getLanguages(function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 140);

			assert.deepEqual(result[0].iso639_1, 'ab');
			assert.deepEqual(result[0].label, 'abchaziska');

			assert.deepEqual(result[69].iso639_3, 'mri');
			assert.deepEqual(result[69].label, 'maori');

			assert.deepEqual(result[21].iso639_3, 'eng');
			assert.deepEqual(result[21].iso639_1, 'en');
			assert.deepEqual(result[21].label, 'engelska');

			assert.deepEqual(result[102].iso639_3, 'swe');
			assert.deepEqual(result[102].iso639_1, 'sv');
			assert.deepEqual(result[102].label, 'svenska');

			geoData.labelLang = 'eng'; // Set it back to default, "eng"

			done();
		});
	});

	it('Get only swedish', function(done) {
		geoData.getLanguages({'iso639_1': 'sv'}, function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 1);

			assert.deepEqual(result[0].iso639_3, 'swe');
			assert.deepEqual(result[0].iso639_1, 'sv');
			assert.deepEqual(result[0].label, 'Swedish');

			done();
		});
	});

	it('Get only swedish and english', function(done) {
		geoData.getLanguages({'iso639_3': ['swe', 'eng']}, function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 2);

			assert.deepEqual(result[0].iso639_3, 'eng');
			assert.deepEqual(result[0].iso639_1, 'en');
			assert.deepEqual(result[0].label, 'English');

			assert.deepEqual(result[1].iso639_3, 'swe');
			assert.deepEqual(result[1].iso639_1, 'sv');
			assert.deepEqual(result[1].label, 'Swedish');

			done();
		});
	});
});

describe('Territory functions', function() {
	it('Getting territory labels, basic', function(done) {
		geoData.getTerritories(function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 250);

			assert.deepEqual(result[110].iso3166_1_num, 384);
			assert.deepEqual(result[110].iso3166_1_alpha_3, 'CIV');
			assert.deepEqual(result[110].iso3166_1_alpha_2, 'CI');
			assert.deepEqual(result[110].label, 'Ivory Coast');

			done();
		});
	});

	it('Get Swedish labels', function(done) {
		geoData.getTerritories({'labelLang': 'swe'}, function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 250);

			assert.deepEqual(result[110].iso3166_1_num, 417);
			assert.deepEqual(result[110].iso3166_1_alpha_3, 'KGZ');
			assert.deepEqual(result[110].iso3166_1_alpha_2, 'KG');
			assert.deepEqual(result[110].label, 'Kirgizistan');

			done();
		});
	});

	it('Get only Germany', function(done) {
		geoData.getTerritories({'iso3166_1_alpha_2': 'DE'}, function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 1);

			assert.deepEqual(result[0].iso3166_1_num, 276);
			assert.deepEqual(result[0].iso3166_1_alpha_3, 'DEU');
			assert.deepEqual(result[0].iso3166_1_alpha_2, 'DE');
			assert.deepEqual(result[0].label, 'Germany');

			done();
		});
	});

	it('Get only Germany and Russia', function(done) {
		geoData.getTerritories({'iso3166_1_alpha_2': ['DE', 'RU']}, function(err, result) {
			if (err) throw err;

			assert.deepEqual(result.length, 2);

			assert.deepEqual(result[0].iso3166_1_num, 276);
			assert.deepEqual(result[0].iso3166_1_alpha_3, 'DEU');
			assert.deepEqual(result[0].iso3166_1_alpha_2, 'DE');
			assert.deepEqual(result[0].label, 'Germany');

			assert.deepEqual(result[1].iso3166_1_num, 643);
			assert.deepEqual(result[1].iso3166_1_alpha_3, 'RUS');
			assert.deepEqual(result[1].iso3166_1_alpha_2, 'RU');
			assert.deepEqual(result[1].label, 'Russia');

			done();
		});
	});
});

describe('Currency functions', function() {
	it('Get currencies, iso_4217 codes only', function(done) {

		geoData.getCurrencies(null, function(err, result){
			if (err) throw err;

			assert.deepEqual(result.length, 297);
		});

		done();
	});

	it('Get currencies with descriptions, without lables', function(done){

		geoData.getCurrencies({descriptions: true}, function(err, result){
			if(err) throw err;

			assert.deepEqual(result.length, 297);
			assert.deepEqual(result[0].description, 'Andorran Peseta');
			assert.deepEqual(result[0].iso_4217, 'adp');
			assert.deepEqual(result[0].displayName, undefined);
			assert.deepEqual(result[0].symbol, undefined);

			done();
		});
	});

	it('Get currencies with lables, without descriptions', function(done) {

		geoData.getCurrencies({labelLang: 'sv'}, function(err, result){
			if(err) throw err;

			assert.deepEqual(result.length, 297);
			assert.deepEqual(result[1].description, undefined);
			assert.deepEqual(result[1].displayName, 'Förenade Arabemiratens dirham');
			assert.deepEqual(result[1].symbol, 'AED');

			done();
		});
	});

	it('Get currencies with descriptions and lables', function(done){

		geoData.getCurrencies({labelLang: 'sv', descriptions: true}, function(err, result){
			if(err) throw err;

			assert.deepEqual(result.length, 297);
			assert.deepEqual(result[1].description, 'United Arab Emirates Dirham');
			assert.deepEqual(result[1].displayName, 'Förenade Arabemiratens dirham');
			assert.deepEqual(result[1].symbol, 'AED');

			done();
		});
	});
});