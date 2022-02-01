'use strict';

const GeoLib = require(__dirname + '/../index.js');
const assert = require('assert');
const {Log} = require('larvitutils');
const async = require('async');
const Db = require('larvitdb');
const fs = require('fs');

const log = new Log('warning');

let db;
let geoData;

// Make sure the database is set up
before(function (done) {
	const tasks = [];

	// Let this test take some time
	this.timeout(60000);
	this.slow(3000);

	// Run DB Setup
	tasks.push(function (cb) {
		let confFile;

		if (process.env.DBCONFFILE === undefined) {
			confFile = __dirname + '/../config/db_test.json';
		} else {
			confFile = process.env.DBCONFFILE;
		}

		// First look for absolute path
		fs.stat(confFile, function (err) {
			let dbConf;

			if (err) {

				// Then look for this string in the config folder
				confFile = __dirname + '/../config/' + confFile;
				fs.stat(confFile, function (err) {
					if (err) throw err;
					dbConf = require(confFile);
					dbConf.log = log;
					db.setup(dbConf, cb);
				});

				return;
			}

			dbConf = require(confFile);
			dbConf.log = log;
			db = new Db(dbConf);
			cb();
		});
	});

	// Check for empty db
	tasks.push(async function () {
		await db.removeAllTables();
	});

	// Setup geoData
	tasks.push(async function () {
		geoData = new GeoLib({
			db,
			log,
		});

		await geoData.ready();
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		done();
	});
});

// Tear down the database
after(async function () {
	await db.removeAllTables();
});

describe('Check database for existing stuff', function () {
	it('Check for Sweden', async function () {
		const {rows} = await db.query('SELECT * FROM geo_territories WHERE iso3166_1_alpha_2 = \'SE\'');
		assert(rows.length === 1, 'There should be exactly one row');
		assert(rows[0].iso3166_1_num === 752, 'Swedens numeric code is 752');
	});

	it('Check for Swedish language label', async function () {
		const {rows} = await db.query('SELECT * FROM geo_langlabels WHERE langIso639_3 = \'swe\' AND labelIso639_3 = \'swe\'');
		assert(rows.length === 1, 'There should be exactly one row');
		assert(rows[0].label === 'svenska', 'The correct label should be "svenska", but is "' + rows[0].label + '"');
	});

	it('Check for Swedish territory label', async function () {
		const {rows} = await db.query('SELECT * FROM geo_territorylabels WHERE labelIso639_3 = \'swe\' AND terIso3166_1_alpha_2 = \'SE\'');
		assert.strictEqual(rows.length, 1);
		assert(rows[0].label === 'Sverige', 'The correct label should be "Sverige", but is "' + rows[0].label + '"');
	});
});

describe('Language functions', function () {
	it('Getting language labels, basic', async function () {
		const result = await geoData.getLanguages();
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
	});

	it('Getting all languages', async function () {
		const result = await geoData.getLanguages({type: false, scope: false, gotIso639_1: 'all'});
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
	});

	it('Getting all languages without iso639_1', async function () {
		const result = await geoData.getLanguages({type: false, scope: false, gotIso639_1: false});
		assert.strictEqual(result.length, 8184);
	});

	it('Getting all swedish language labels', async function () {
		geoData.labelLang = 'swe';

		const result = await geoData.getLanguages();
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
	});

	it('Get only swedish', async function () {
		const result = await geoData.getLanguages({iso639_1: 'sv'});
		assert.strictEqual(result.length, 1);

		assert.strictEqual(result[0].iso639_3, 'swe');
		assert.strictEqual(result[0].iso639_1, 'sv');
		assert.strictEqual(result[0].label, 'Swedish');
	});

	it('Get only swedish and english', async function () {
		const result = await geoData.getLanguages({iso639_3: ['swe', 'eng']});
		assert.strictEqual(result.length, 2);

		assert.strictEqual(result[0].iso639_3, 'eng');
		assert.strictEqual(result[0].iso639_1, 'en');
		assert.strictEqual(result[0].label, 'English');

		assert.strictEqual(result[1].iso639_3, 'swe');
		assert.strictEqual(result[1].iso639_1, 'sv');
		assert.strictEqual(result[1].label, 'Swedish');
	});

	it('Get only swedish by specifying iso639_3 as swe', async function () {
		const result = await geoData.getLanguages({iso639_3: 'swe'});
		assert.strictEqual(result.length, 1);

		assert.strictEqual(result[0].iso639_3, 'swe');
		assert.strictEqual(result[0].iso639_1, 'sv');
		assert.strictEqual(result[0].label, 'Swedish');
	});
});

describe('Territory functions', function () {
	it('Getting territory labels, basic', async function () {
		const result = await geoData.getTerritories();
		assert.strictEqual(result.length, 250);

		assert.strictEqual(result[110].iso3166_1_num, 384);
		assert.strictEqual(result[110].iso3166_1_alpha_3, 'CIV');
		assert.strictEqual(result[110].iso3166_1_alpha_2, 'CI');
		assert.strictEqual(result[110].label, 'Ivory Coast');
	});

	it('Get Swedish labels', async function () {
		const result = await geoData.getTerritories({labelLang: 'swe'});
		assert.strictEqual(result.length, 250);

		assert.strictEqual(result[110].iso3166_1_num, 417);
		assert.strictEqual(result[110].iso3166_1_alpha_3, 'KGZ');
		assert.strictEqual(result[110].iso3166_1_alpha_2, 'KG');
		assert.strictEqual(result[110].label, 'Kirgizistan');
	});

	it('Get Swedish labels collate by utf8mb4_swedish_ci', async function () {
		const result = await geoData.getTerritories({labelLang: 'swe', collate: 'utf8mb4_swedish_ci'});
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
	});

	it('Get only Germany', async function () {
		const result = await geoData.getTerritories({iso3166_1_alpha_2: 'DE'});
		assert.strictEqual(result.length, 1);

		assert.strictEqual(result[0].iso3166_1_num, 276);
		assert.strictEqual(result[0].iso3166_1_alpha_3, 'DEU');
		assert.strictEqual(result[0].iso3166_1_alpha_2, 'DE');
		assert.strictEqual(result[0].label, 'Germany');
	});

	it('Get only Germany and Russia', async function () {
		const result = await geoData.getTerritories({iso3166_1_alpha_2: ['DE', 'RU']});
		assert.strictEqual(result.length, 2);

		assert.strictEqual(result[0].iso3166_1_num, 276);
		assert.strictEqual(result[0].iso3166_1_alpha_3, 'DEU');
		assert.strictEqual(result[0].iso3166_1_alpha_2, 'DE');
		assert.strictEqual(result[0].label, 'Germany');

		assert.strictEqual(result[1].iso3166_1_num, 643);
		assert.strictEqual(result[1].iso3166_1_alpha_3, 'RUS');
		assert.strictEqual(result[1].iso3166_1_alpha_2, 'RU');
		assert.strictEqual(result[1].label, 'Russia');
	});

	it('Get region for territory', async function () {
		// Germany
		const regions = await geoData.getRegionForTerritory(276);
		assert.notStrictEqual(regions, undefined);
		assert.strictEqual(regions.length, 2);

		for (let r of regions) {
			if (r.id === 155) {
				assert.strictEqual(r.name, 'Western Europe');
				assert.notStrictEqual(r.parent, undefined);
				assert.strictEqual(r.parent.id, 150);
				assert.notStrictEqual(r.parent.parent, undefined);
				assert.strictEqual(r.parent.parent.id, 1);
			} else {
				assert.strictEqual(r.name, 'European Union');
				assert.strictEqual(r.parent, undefined);
			}
		}
	});

	it('Get counties without terrtiory code throws an error', async function () {
		await assert.rejects(async () => await geoData.getCounties({}), new Error('Required option "iso_3166_1_alpha_3" not set'));
	});

	it('Get municipalities without terrtiory code throws an error', async function () {
		await assert.rejects(async () => await geoData.getMunicipalities({}), new Error('Required option "iso_3166_1_alpha_3" not set'));
	});

	it('Get counties orderd by code', async function () {
		const result = await geoData.getCounties({iso_3166_1_alpha_3: 'SWE', orderBy: 'code'});
		assert.strictEqual(result.length, 21);
		assert.strictEqual(result[0].label, 'Stockholms län');
		assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
		assert.strictEqual(result[0].code, '01');
	});

	it('Get counties ordered by label', async function () {
		const result = await geoData.getCounties({iso_3166_1_alpha_3: 'SWE', orderBy: 'label'});
		assert.strictEqual(result.length, 21);
		assert.strictEqual(result[0].label, 'Blekinge län');
		assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
		assert.strictEqual(result[0].code, '10');
	});

	it('Get counties with municipalities', async function () {
		const result = await geoData.getCounties({iso_3166_1_alpha_3: 'SWE', orderBy: 'code', includeMunicipalities: true});
		assert.strictEqual(result.length, 21);
		assert.strictEqual(result[0].label, 'Stockholms län');
		assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
		assert.strictEqual(result[0].code, '01');

		assert.strictEqual(result[0].municipalities.length, 26);
		assert.strictEqual(result[0].municipalities[0].label, 'Botkyrka');
		assert.strictEqual(result[0].municipalities[0].code, '0127');
	});

	it('Get municipalities ordered by code', async function () {
		const result = await geoData.getMunicipalities({iso_3166_1_alpha_3: 'SWE', orderBy: 'code'});
		assert.strictEqual(result.length, 290);
		assert.strictEqual(result[0].label, 'Upplands Väsby');
		assert.strictEqual(result[0].county_label, 'Stockholms län');
		assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
		assert.strictEqual(result[0].code, '0114');
	});

	it('Get municipalities ordered by label', async function () {
		const result = await geoData.getMunicipalities({iso_3166_1_alpha_3: 'SWE', orderBy: 'label'});
		assert.strictEqual(result.length, 290);
		assert.strictEqual(result[0].label, 'Ale');
		assert.strictEqual(result[0].county_label, 'Västra Götalands län');
		assert.strictEqual(result[0].iso_3166_1_alpha_3, 'SWE');
		assert.strictEqual(result[0].code, '1440');
	});
});

describe('Currency functions', function () {
	it('Get currencies, iso_4217 codes only', async function () {
		const result = await geoData.getCurrencies(null);
		assert.strictEqual(result.length, 297);
	});

	it('Get currencies with descriptions, without lables', async function () {
		const result = await geoData.getCurrencies({descriptions: true});
		assert.strictEqual(result.length, 297);
		assert.strictEqual(result[0].description, 'Andorran Peseta');
		assert.strictEqual(result[0].iso_4217, 'adp');
		assert.strictEqual(result[0].displayName, undefined);
		assert.strictEqual(result[0].symbol, undefined);
	});

	it('Get currencies with lables, without descriptions', async function () {
		const result = await geoData.getCurrencies({labelLang: 'sv'});
		assert.strictEqual(result.length, 297);
		assert.strictEqual(result[1].description, undefined);
		assert.strictEqual(result[1].displayName, 'Förenade Arabemiratens dirham');
		assert.strictEqual(result[1].symbol, 'AED');
	});

	it('Get currencies with lables and descriptions', async function () {
		const result = await geoData.getCurrencies({labelLang: 'sv', descriptions: true});
		assert.strictEqual(result.length, 297);
		assert.strictEqual(result[1].description, 'United Arab Emirates Dirham');
		assert.strictEqual(result[1].displayName, 'Förenade Arabemiratens dirham');
		assert.strictEqual(result[1].symbol, 'AED');
	});
});
