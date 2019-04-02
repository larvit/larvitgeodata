'use strict';

const	GeoLib	= require(__dirname + '/../index.js'),
	assert	= require('assert'),
	LUtils	= require('larvitutils'),
	lUtils	= new LUtils(),
	async	= require('async'),
	log	= new lUtils.Log('warning'),
	db	= require('larvitdb'),
	fs	= require('fs');

let	geoData;

// Make sure the database is set up
before(function (done) {
	const	tasks	= [];

	// Let this test take some time
	this.timeout(60000);
	this.slow(3000);

	// Run DB Setup
	tasks.push(function (cb) {
		let	confFile;

		if (process.env.DBCONFFILE === undefined) {
			confFile	= __dirname + '/../config/db_test.json';
		} else {
			confFile	= process.env.DBCONFFILE;
		}

		// First look for absolute path
		fs.stat(confFile, function (err) {
			let	dbConf;

			if (err) {

				// Then look for this string in the config folder
				confFile	= __dirname + '/../config/' + confFile;
				fs.stat(confFile, function (err) {
					if (err) throw err;
					dbConf	= require(confFile);
					dbConf.log	= log;
					db.setup(dbConf, cb);
				});

				return;
			}

			dbConf	= require(confFile);
			dbConf.log	= log;
			db.setup(dbConf, cb);
		});
	});

	// Check for empty db
	tasks.push(function (cb) {
		db.query('SHOW TABLES', function (err, rows) {
			if (err) throw err;

			if (rows.length) {
				throw new Error('Database is not empty. To make a test, you must supply an empty database!');
			}

			cb();
		});
	});

	// Setup geoData
	tasks.push(function (cb) {
		geoData = new GeoLib({
			'db':	db,
			'log':	log
		});

		geoData.ready(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		done();
	});
});

// Tear down the database
after(function (done) {
	db.removeAllTables(done);
});

describe('Check database for existing stuff', function () {
	it('Check for Sweden', function (done) {
		db.query('SELECT * FROM geo_territories WHERE iso3166_1_alpha_2 = \'SE\'', function (err, rows) {
			if (err) throw err;
			assert(rows.length === 1, 'There should be exactly one row');
			assert(rows[0].iso3166_1_num === 752, 'Swedens numeric code is 752');

			done();
		});
	});

	it('Check for Swedish language label', function (done) {
		db.query('SELECT * FROM geo_langlabels WHERE langIso639_3 = \'swe\' AND labelIso639_3 = \'swe\'', function (err, rows) {
			if (err) throw err;
			assert(rows.length === 1, 'There should be exactly one row');
			assert(rows[0].label === 'svenska', 'The correct label should be "svenska", but is "' + rows[0].label + '"');

			done();
		});
	});

	it('Check for Swedish territory label', function (done) {
		db.query('SELECT * FROM geo_territorylabels WHERE labelIso639_3 = \'swe\' AND terIso3166_1_alpha_2 = \'SE\'', function (err, rows) {
			if (err) throw err;
			assert.strictEqual(rows.length, 1);
			assert(rows[0].label === 'Sverige', 'The correct label should be "Sverige", but is "' + rows[0].label + '"');

			done();
		});
	});
});

describe('Language functions', function () {
	it('Getting language labels, basic', function (done) {
		geoData.getLanguages(function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 140);

			assert.strictEqual(result[0].iso639_1, 'ab');
			assert.strictEqual(result[0].label, 'Abkhazian');

			assert.strictEqual(result[69].iso639_3, 'lit');
			assert.strictEqual(result[69].label, 'Lithuanian');

			assert.strictEqual(result[30].iso639_3, 'eng');
			assert.strictEqual(result[30].iso639_1, 'en');
			assert.strictEqual(result[30].label, 'English');

			assert.strictEqual(result[112].iso639_3, 'swe');
			assert.strictEqual(result[112].iso639_1, 'sv');
			assert.strictEqual(result[112].label, 'Swedish');

			done();
		});
	});

	it('Getting all languages', function (done) {
		geoData.getLanguages({'type': false, 'scope': false, 'gotIso639_1': 'all'}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 8368);

			assert.strictEqual(result[0].iso639_3, 'aaa');
			assert.strictEqual(result[0].iso639_1, null);
			assert.strictEqual(result[0].scope, 'individual');
			assert.strictEqual(result[0].type, 'living');
			assert.strictEqual(result[0].label, null);

			assert.strictEqual(result[8367].iso639_3, 'zun');
			assert.strictEqual(result[8367].iso639_1, null);
			assert.strictEqual(result[8367].scope, 'individual');
			assert.strictEqual(result[8367].type, 'living');
			assert.strictEqual(result[8367].label, 'Zuni');

			done();
		});
	});

	it('Getting all swedish language labels', function (done) {
		geoData.labelLang = 'swe';

		geoData.getLanguages(function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 140);

			assert.strictEqual(result[0].iso639_1, 'ab');
			assert.strictEqual(result[0].label, 'abchaziska');

			assert.strictEqual(result[69].iso639_3, 'mri');
			assert.strictEqual(result[69].label, 'maori');

			assert.strictEqual(result[21].iso639_3, 'eng');
			assert.strictEqual(result[21].iso639_1, 'en');
			assert.strictEqual(result[21].label, 'engelska');

			assert.strictEqual(result[102].iso639_3, 'swe');
			assert.strictEqual(result[102].iso639_1, 'sv');
			assert.strictEqual(result[102].label, 'svenska');

			geoData.labelLang = 'eng'; // Set it back to default, "eng"

			done();
		});
	});

	it('Get only swedish', function (done) {
		geoData.getLanguages({'iso639_1': 'sv'}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 1);

			assert.strictEqual(result[0].iso639_3, 'swe');
			assert.strictEqual(result[0].iso639_1, 'sv');
			assert.strictEqual(result[0].label, 'Swedish');

			done();
		});
	});

	it('Get only swedish and english', function (done) {
		geoData.getLanguages({'iso639_3': ['swe', 'eng']}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 2);

			assert.strictEqual(result[0].iso639_3, 'eng');
			assert.strictEqual(result[0].iso639_1, 'en');
			assert.strictEqual(result[0].label, 'English');

			assert.strictEqual(result[1].iso639_3, 'swe');
			assert.strictEqual(result[1].iso639_1, 'sv');
			assert.strictEqual(result[1].label, 'Swedish');

			done();
		});
	});
});

describe('Territory functions', function () {
	it('Getting territory labels, basic', function (done) {
		geoData.getTerritories(function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 250);

			assert.strictEqual(result[110].iso3166_1_num, 384);
			assert.strictEqual(result[110].iso3166_1_alpha_3, 'CIV');
			assert.strictEqual(result[110].iso3166_1_alpha_2, 'CI');
			assert.strictEqual(result[110].label, 'Ivory Coast');

			done();
		});
	});

	it('Get Swedish labels', function (done) {
		geoData.getTerritories({'labelLang': 'swe'}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 250);

			assert.strictEqual(result[110].iso3166_1_num, 417);
			assert.strictEqual(result[110].iso3166_1_alpha_3, 'KGZ');
			assert.strictEqual(result[110].iso3166_1_alpha_2, 'KG');
			assert.strictEqual(result[110].label, 'Kirgizistan');

			done();
		});
	});

	it('Get Swedish labels collate by utf8mb4_swedish_ci', function (done) {
		geoData.getTerritories({'labelLang': 'swe', 'collate': 'utf8mb4_swedish_ci'}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 250);

			assert.strictEqual(result[247].iso3166_1_num, 248);
			assert.strictEqual(result[247].iso3166_1_alpha_3, 'ALA');
			assert.strictEqual(result[247].iso3166_1_alpha_2, 'AX');
			assert.strictEqual(result[247].label, 'Åland');

			assert.strictEqual(result[248].iso3166_1_num, 40);
			assert.strictEqual(result[248].iso3166_1_alpha_3, 'AUT');
			assert.strictEqual(result[248].iso3166_1_alpha_2, 'AT');
			assert.strictEqual(result[248].label, 'Österrike');

			assert.strictEqual(result[249].iso3166_1_num, 626);
			assert.strictEqual(result[249].iso3166_1_alpha_3, 'TLS');
			assert.strictEqual(result[249].iso3166_1_alpha_2, 'TL');
			assert.strictEqual(result[249].label, 'Östtimor');

			done();
		});
	});

	it('Get only Germany', function (done) {
		geoData.getTerritories({'iso3166_1_alpha_2': 'DE'}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 1);

			assert.strictEqual(result[0].iso3166_1_num, 276);
			assert.strictEqual(result[0].iso3166_1_alpha_3, 'DEU');
			assert.strictEqual(result[0].iso3166_1_alpha_2, 'DE');
			assert.strictEqual(result[0].label, 'Germany');

			done();
		});
	});

	it('Get only Germany and Russia', function (done) {
		geoData.getTerritories({'iso3166_1_alpha_2': ['DE', 'RU']}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 2);

			assert.strictEqual(result[0].iso3166_1_num, 276);
			assert.strictEqual(result[0].iso3166_1_alpha_3, 'DEU');
			assert.strictEqual(result[0].iso3166_1_alpha_2, 'DE');
			assert.strictEqual(result[0].label, 'Germany');

			assert.strictEqual(result[1].iso3166_1_num, 643);
			assert.strictEqual(result[1].iso3166_1_alpha_3, 'RUS');
			assert.strictEqual(result[1].iso3166_1_alpha_2, 'RU');
			assert.strictEqual(result[1].label, 'Russia');

			done();
		});
	});

	it('Get region for territory', function (done) {
		// Germany
		geoData.getRegionForTerritory(276, function (err, regions) {
			if (err) throw err;

			assert.notStrictEqual(regions,	undefined);
			assert.strictEqual(regions.length,	2);

			for (let r of regions) {
				if (r.id === 155) {
					assert.strictEqual(r.name,	'Western Europe');
					assert.notStrictEqual(r.parent,	undefined);
					assert.strictEqual(r.parent.id,	150);
					assert.notStrictEqual(r.parent.parent,	undefined);
					assert.strictEqual(r.parent.parent.id,	1);
				} else {
					assert.strictEqual(r.name,	'European Union');
					assert.strictEqual(r.parent,	undefined);
				}
			}

			done();
		});
	});

	it('Get counties without terrtiory code', function (done) {
		geoData.getCounties({}, function (err, result) {
			assert.notStrictEqual(err, null);
			assert.notStrictEqual(err, undefined);
			assert.strictEqual(result, undefined);
			done();
		});
	});

	it('Get municipalities without terrtiory code', function (done) {
		geoData.getMunicipalities({}, function (err, result) {
			assert.notStrictEqual(err, null);
			assert.notStrictEqual(err, undefined);
			assert.strictEqual(result, undefined);
			done();
		});
	});

	it('Get counties', function (done) {
		geoData.getCounties({'iso_3166_1_alpha_3': 'SWE', 'orderBy': 'code'}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 21);
			assert.strictEqual(result[0].label, 'Stockholms län');
			assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
			assert.strictEqual(result[0].code, '01');

			geoData.getCounties({'iso_3166_1_alpha_3': 'SWE', 'orderBy': 'label'}, function (err, result) {
				if (err) throw err;

				assert.strictEqual(result.length, 21);
				assert.strictEqual(result[0].label, 'Blekinge län');
				assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
				assert.strictEqual(result[0].code, '10');

				done();
			});
		});
	});

	it('Get counties with municipalities', function (done) {
		geoData.getCounties({'iso_3166_1_alpha_3': 'SWE', 'orderBy': 'code', 'includeMunicipalities': true}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 21);
			assert.strictEqual(result[0].label, 'Stockholms län');
			assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
			assert.strictEqual(result[0].code, '01');

			assert.strictEqual(result[0].municipalities.length, 26);
			assert.strictEqual(result[0].municipalities[0].label, 'Botkyrka');
			assert.strictEqual(result[0].municipalities[0].code, '0127');

			done();
		});
	});

	it('Get municipalities', function (done) {
		geoData.getMunicipalities({'iso_3166_1_alpha_3': 'SWE', 'orderBy': 'code'}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 290);
			assert.strictEqual(result[0].label, 'Upplands Väsby');
			assert.strictEqual(result[0].county_label, 'Stockholms län');
			assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
			assert.strictEqual(result[0].code, '0114');

			geoData.getMunicipalities({'iso_3166_1_alpha_3': 'SWE', 'orderBy': 'label'}, function (err, result) {
				if (err) throw err;

				assert.strictEqual(result.length, 290);
				assert.strictEqual(result[0].label, 'Ale');
				assert.strictEqual(result[0].county_label, 'Västra Götalands län');
				assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
				assert.strictEqual(result[0].code, '1440');

				done();
			});
		});
	});
});

describe('Currency functions', function () {
	it('Get currencies, iso_4217 codes only', function (done) {

		geoData.getCurrencies(null, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 297);
		});

		done();
	});

	it('Get currencies with descriptions, without lables', function (done) {

		geoData.getCurrencies({'descriptions': true}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 297);
			assert.strictEqual(result[0].description, 'Andorran Peseta');
			assert.strictEqual(result[0].iso_4217, 'adp');
			assert.strictEqual(result[0].displayName, undefined);
			assert.strictEqual(result[0].symbol, undefined);

			done();
		});
	});

	it('Get currencies with lables, without descriptions', function (done) {

		geoData.getCurrencies({'labelLang': 'sv'}, function (err, result) {
			if (err) throw err;

			assert.strictEqual(result.length, 297);
			assert.strictEqual(result[1].description, undefined);
			assert.strictEqual(result[1].displayName, 'Förenade Arabemiratens dirham');
			assert.strictEqual(result[1].symbol, 'AED');

			done();
		});
	});

	//it('Get currencies with descriptions and lables', function (done));
});
