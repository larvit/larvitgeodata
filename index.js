'use strict';

const EventEmitter = require('events').EventEmitter;
const {DbMigration} = require('larvitdbmigration');
const {Log} = require('larvitutils');
const async = require('async');

class Geodata {
	constructor(options) {
		this.options = options || {};

		if (!this.options.db) throw new Error('Required option db is missing');
		if (!this.options.log) {
			this.options.log = new Log();
		}
		this.log = this.options.log;

		this.db = this.options.db;
		this.dbChecked = false;
		this.eventEmitter = new EventEmitter();
		this.labelLang = 'eng';

		this.log.debug('larvitgeodata: index.js - Waiting for dbmigration()');
	}

	async ready() {
		if (this.dbChecked) {
			return;
		}

		const dbMigrationOptions = {};
		dbMigrationOptions.dbType = this.options.dbType || 'mariadb';
		dbMigrationOptions.dbDriver = this.db;
		dbMigrationOptions.tableName = this.options.tableName || 'geo_db_version';
		dbMigrationOptions.migrationScriptPath = this.options.migrationScriptPath || __dirname + '/dbmigration';
		dbMigrationOptions.log = this.log;

		const dbMigration = new DbMigration(dbMigrationOptions);
		await dbMigration.run();
		this.dbChecked = true;
	};

	async getCounties(options) {
		const dbFields = [];

		if (!options || !options.iso_3166_1_alpha_3) throw new Error('Required option "iso_3166_1_alpha_3" not set');

		let sql = 'SELECT * FROM `geo_counties` WHERE `iso_3166_1_alpha_3` = ?';
		dbFields.push(options.iso_3166_1_alpha_3);

		if (options.orderBy === 'code') {
			sql += ' ORDER BY `code`';
		} else if (options.orderBy === 'label') {
			sql += ' ORDER BY `label`';
		}

		const {rows} = await this.db.query(sql, dbFields);

		const counties = [];

		for (let i = 0; rows[i] !== undefined; i++) {
			counties.push({
				iso_3166_1_alpha_3: rows[i].iso_3166_1_alpha_3,
				label: rows[i].label,
				code: rows[i].code,
			});
		}

		if (options.includeMunicipalities === true) {
			const tasks = [];

			for (let i = 0; counties[i] !== undefined; i++) {
				tasks.push(async () => {
					const result = await this.getMunicipalities({iso_3166_1_alpha_3: options.iso_3166_1_alpha_3, county_label: counties[i].label});
					counties[i].municipalities = result;
				});
			}

			await async.parallel(tasks);
		}

		return counties;
	}

	async getCurrencies(options) {
		const dbFields = [];

		let sql;

		// Just currency codes
		if (!options || (!options.descriptions && !options.labelLang)) {
			sql = 'SELECT iso_4217 FROM `geo_currencies`';
		} else {
			if (options.descriptions && !options.labelLang) {
				sql = 'SELECT * FROM `geo_currencies`';
			}

			if (options.labelLang && !options.descriptions) {
				sql = 'SELECT c.iso_4217, cl.symbol, cl.displayName FROM `geo_currencies` c  JOIN `geo_currencylables` cl on c.iso_4217 = cl.iso_4217 WHERE cl.langIso639_1 = ?';
				dbFields.push(options.labelLang);
			}

			if (options.descriptions && options.labelLang) {
				sql = 'SELECT c.iso_4217, c.description, cl.symbol, cl.displayName FROM `geo_currencies` c JOIN `geo_currencylables` cl on c.iso_4217 = cl.iso_4217 WHERE cl.langIso639_1 = ?';
				dbFields.push(options.labelLang);
			}
		}

		await this.ready();

		const {rows} = await this.db.query(sql, dbFields);

		return rows;
	};

	async getLanguages(options) {
		const dbFields = [];

		options = options || {};

		if (options.gotIso639_1 === undefined) options.gotIso639_1 = true;
		if (options.labelLang === undefined) options.labelLang = this.labelLang;
		if (options.scope === undefined) options.scope = 'individual';
		if (options.type === undefined) options.type = 'living';

		if (options.iso639_3 !== undefined && options.iso639_3 !== false && !(options.iso639_3 instanceof Array)) {
			options.iso639_3 = [options.iso639_3];
		}

		if (options.iso639_1 !== undefined && options.iso639_1 !== false && !(options.iso639_1 instanceof Array)) {
			options.iso639_1 = [options.iso639_1];
		}

		let sql = 'SELECT langs.*, labels.label FROM geo_langs langs LEFT JOIN geo_langlabels labels ON labels.langIso639_3 = langs.iso639_3 ';

		if (options.labelLang !== false && options.labelLang !== undefined && options.labelLang !== false) {
			sql += ' AND labels.labelIso639_3 = ?';
			dbFields.push(options.labelLang);
		}

		sql += ' WHERE 1 = 1';

		if (options.scope !== false) {
			sql += ' AND langs.scope = ?';
			dbFields.push(options.scope);
		}

		if (options.type !== false) {
			sql += ' AND langs.type = ?';
			dbFields.push(options.type);
		}

		if (options.gotIso639_1 === false) {
			sql += ' AND langs.iso639_1 IS NULL';
		} else if (options.gotIso639_1 === true) {
			sql += ' AND langs.iso639_1 IS NOT NULL';
		}

		if (options.iso639_1 !== undefined) {
			sql += ' AND langs.iso639_1 IN (';

			for (let i = 0; options.iso639_1[i] !== undefined; i++) {
				sql += '?,';
				dbFields.push(options.iso639_1[i]);
			}

			sql = sql.substring(0, sql.length - 1) + ')';
		}

		if (options.iso639_3 !== undefined) {
			sql += ' AND langs.iso639_3 IN (';

			for (let i = 0; options.iso639_3[i] !== undefined; i++) {
				sql += '?,';
				dbFields.push(options.iso639_3[i]);
			}

			sql = sql.substring(0, sql.length - 1) + ')';
		}

		sql += ' ORDER BY labels.label, langs.iso639_3';

		await this.ready();
		const {rows} = await this.db.query(sql, dbFields);

		return rows;
	};

	async getMunicipalities(options) {
		const dbFields = [];

		if (!options || !options.iso_3166_1_alpha_3) throw new Error('Required option "iso_3166_1_alpha_3" not set');

		let sql = 'SELECT * FROM geo_municipalities WHERE iso_3166_1_alpha_3 = ?';
		dbFields.push(options.iso_3166_1_alpha_3);

		if (options.county_label) {
			sql += ' AND county_label = ?';
			dbFields.push(options.county_label);
		}

		if (options.orderBy === 'code') {
			sql += ' ORDER BY code';
		} else if (options.orderBy === 'label') {
			sql += ' ORDER BY label';
		}

		const {rows} = await this.db.query(sql, dbFields);
		let municiaplities = [];

		for (let i = 0; rows[i] !== undefined; i++) {
			municiaplities.push({
				iso_3166_1_alpha_3: rows[i].iso_3166_1_alpha_3,
				county_label: rows[i].county_label,
				label: rows[i].label,
				code: rows[i].code,
			});
		}

		return municiaplities;
	};

	async getRegionForTerritory(territoryCode) {
		const tasks = [];

		let regionsTerritory = null;
		let regionRegions = null;
		let regions = null;

		tasks.push(async () => {
			const {rows} = await this.db.query('SELECT * FROM geo_regions');
			regions = rows;
		});

		tasks.push(async () => {
			const {rows} = await this.db.query('SELECT * FROM geo_regions_territory WHERE contains = ?', [String(territoryCode)]);
			regionsTerritory = rows;
		});

		tasks.push(async () => {
			const {rows} = await this.db.query('SELECT * FROM geo_regions_region');
			regionRegions = rows;
		});

		await async.parallel(tasks);

		const result = [];
		function getParents(regionId) {
			const rr = regionRegions.find(function (item) { return item.contains === regionId; });

			if (rr === undefined) {
				return false;
			} else {
				const pr = regions.find(function (item) { return item.id === rr.id; });
				const parentsParent = getParents(pr.id);

				if (parentsParent) {
					pr.parent = parentsParent;
				}

				return pr;
			}
		};

		for (let rt of regionsTerritory) {
			const region = regions.find(function (r) { return r.id === rt.id; });

			if (region === undefined) {
				continue;
			} else {
				const tp = getParents(region.id);

				if (tp) {
					region.parent = tp;
				}

				result.push(region);
			}
		}

		return result;
	};

	async getTerritories(options) {
		const dbFields = [];

		options = options || {};

		if (options.labelLang === undefined) {
			options.labelLang = this.labelLang;
		}

		let sql = 'SELECT territories.*, labels.label FROM geo_territories territories LEFT JOIN geo_territorylabels labels ON labels.terIso3166_1_alpha_2 = territories.iso3166_1_alpha_2 ';

		if (options.labelLang !== false && options.labelLang !== undefined) {
			sql += ' AND labels.labelIso639_3 = ?';
			dbFields.push(options.labelLang);
		}

		sql += ' WHERE 1 = 1';

		for (let key of ['iso3166_1_num', 'iso3166_1_alpha_2', 'iso3166_1_alpha_3']) {
			if (options[key] === undefined) {
				continue;
			} else if (!(options[key] instanceof Array)) {
				options[key] = [options[key]];
			}

			if (options[key].length === 0) {
				sql += ' AND 1 = 2';
				continue;
			}

			sql += ' AND territories.' + key + ' IN (';
			for (let i = 0; options[key][i] !== undefined; i++) {
				sql += '?,';
				dbFields.push(options[key][i]);
			}

			sql = sql.substring(0, sql.length - 1) + ')';
		}

		if (options.collate && options.collate !== '') {
			sql += ' ORDER BY labels.label COLLATE ?, territories.iso3166_1_alpha_2';
			dbFields.push(options.collate);

		} else {
			sql += ' ORDER BY labels.label, territories.iso3166_1_alpha_2';
		}

		await this.ready();
		const {rows} = await this.db.query(sql, dbFields);

		return rows;
	};
}

exports = module.exports = Geodata;
