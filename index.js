'use strict';

const	EventEmitter	= require('events').EventEmitter,
	DbMigration	= require('larvitdbmigration'),
	LUtils	= require('larvitutils'),
	async	= require('async'),
	_	= require('lodash');

function Geodata(options) {
	const	that	= this,
		dbMigrationOptions	= {};

	let	dbMigration;

	that.options	= options || {};

	if ( ! that.options.db) {
		throw new Error('Required option db is missing');
	}

	if ( ! that.options.log) {
		const	lUtils	= new LUtils();
		that.options.log	= new lUtils.Log();
	}
	that.log	= that.options.log;

	that.db	= that.options.db;
	that.dbChecked	= false;
	that.eventEmitter	= new EventEmitter();
	that.labelLang	= 'eng';

	that.log.debug('larvitgeodata: index.js - Waiting for dbmigration()');

	dbMigrationOptions.dbType	= that.options.dbType || 'mariadb';
	dbMigrationOptions.dbDriver	= that.db;
	dbMigrationOptions.tableName	= that.options.tableName || 'geo_db_version';
	dbMigrationOptions.migrationScriptsPath	= that.options.migrationScriptsPath || __dirname + '/dbmigration';
	dbMigrationOptions.log	= that.log;

	dbMigration	= new DbMigration(dbMigrationOptions);
	dbMigration.run(function (err) {
		if (err) {
			that.log.error('larvitgeodata: index.js - Database migration error: ' + err.message);
		}

		that.dbChecked	= true;
		that.eventEmitter.emit('checked');
	});
}

Geodata.prototype.ready = function ready(cb) {
	if (this.dbChecked) {
		return cb();
	}

	this.eventEmitter.on('checked', cb);
};

Geodata.prototype.getCurrencies = function getCurrencies(options, cb) {
	const	dbFields	= [],
		that	= this;

	let	sql;

	// Just currency codes
	if ( ! options || (! options.descriptions && ! options.labelLang)) {
		sql	= 'SELECT iso_4217 FROM `geo_currencies`';
	} else {
		if (options.descriptions && ! options.labelLang) {
			sql	= 'SELECT * FROM `geo_currencies`';
		}

		if (options.labelLang && ! options.descriptions) {
			sql	= 'SELECT c.iso_4217, cl.symbol, cl.displayName FROM `geo_currencies` c  JOIN `geo_currencyLables` cl on c.iso_4217 = cl.iso_4217 WHERE cl.langIso639_1 = ?';
			dbFields.push(options.labelLang);
		}

		if (options.descriptions && options.labelLang) {
			sql	= 'SELECT c.iso_4217, c.description, cl.symbol, cl.displayName FROM `geo_currencies` c JOIN `geo_currencyLables` cl on c.iso_4217 = cl.iso_4217 WHERE cl.langIso639_1 = ?';
			dbFields.push(options.labelLang);
		}
	}

	that.ready(function () {
		that.db.query(sql, dbFields, cb);
	});
};

/**
 * Get list of languages
 *
 * @param obj options -
 * @param func cb(err, result) - result like [{'iso639_3': 'aar', 'iso639_1': 'aa', 'type': 'living', 'scope': 'individual', 'label': 'Afar'}]
 */
Geodata.prototype.getLanguages = function getLanguages(options, cb) {
	const	dbFields	= [],
		that	= this;

	let	sql;

	if (typeof options === 'function') {
		cb	= options;
		options	= {};
	}

	if (options.gotIso639_1	=== undefined) options.gotIso639_1	= true;
	if (options.labelLang	=== undefined) options.labelLang	= that.labelLang;
	if (options.scope	=== undefined) options.scope	= 'individual';
	if (options.type	=== undefined) options.type	= 'living';

	if (options.iso639_3 !== undefined && options.iso639_3 !== false && ! (options.iso639_3 instanceof Array)) {
		options.iso639_3	= [options.iso639_3];
	}

	if (options.iso639_1 !== undefined && options.iso639_1 !== false && ! (options.iso639_1 instanceof Array)) {
		options.iso639_1	= [options.iso639_1];
	}

	sql = 'SELECT langs.*, labels.label FROM geo_langs langs LEFT JOIN geo_langLabels labels ON labels.langIso639_3 = langs.iso639_3 ';

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

		for (let i = 0; options.iso639_1[i] !== undefined; i ++) {
			sql += '?,';
			dbFields.push(options.iso639_1[i]);
		}

		sql	= sql.substring(0, sql.length - 1) + ')';
	}

	if (options.iso639_3 !== undefined) {
		sql += ' AND langs.iso639_3 IN (';

		for (let i = 0; options.iso639_3[i] !== undefined; i ++) {
			sql += '?,';
			dbFields.push(options.iso639_3[i]);
		}

		sql = sql.substring(0, sql.length - 1) + ')';
	}

	sql += ' ORDER BY labels.label, langs.iso639_3';

	this.ready(function () {
		that.db.query(sql, dbFields, cb);
	});
};

/**
 * Get region with parent regions for territory
 *
 * @param territoryCode int - the iso3166_1_num of the territory
 * @param func cb(err, result) - result like [{'name': 'Something', 'id': '1', 'type': 'subcontinent', 'slug': 'something', 'parent': { 'id' : '2', 'name': 'Parent region' ...} }]
 */
Geodata.prototype.getRegionForTerritory = function getRegionForTerritory(territoryCode, cb) {
	const	tasks	= [],
		that	= this;

	let	regionsTerritory	= null,
		regionRegions	= null,
		regions	= null;

	tasks.push(function (cb) {
		that.db.query('SELECT * FROM geo_regions', function (err, rows) {
			regions	= rows;
			cb(err);
		});
	});

	tasks.push(function (cb) {
		that.db.query('SELECT * FROM geo_regions_territory WHERE contains = ?', [String(territoryCode)], function (err, rows) {
			regionsTerritory	= rows;
			cb(err);
		});
	});

	tasks.push(function (cb) {
		that.db.query('SELECT * FROM geo_regions_region', function (err, rows) {
			regionRegions	= rows;
			cb(err);
		});
	});

	async.parallel(tasks, function (err) {
		const result = [],
			getParents = function (regionId) {
				let	rr	= _.find(regionRegions, function (item) { return item.contains === regionId; });

				if (rr === undefined) {
					return false;
				} else {
					let	pr	= _.find(regions, function (item) { return item.id == rr.id; }),
						parentsParent	= getParents(pr.id);

					if (parentsParent) {
						pr.parent	= parentsParent;
					}

					return pr;
				}
			};

		if (err) {
			that.log.warn('larvitgeodata - index.js: Failed to get data: ' + err.message);
			return cb(err);
		}

		for (let rt of regionsTerritory) {
			const	region	= _.find(regions, function (r) { return r.id == rt.id; });

			if (region === undefined) {
				continue;
			} else {
				const	tp	= getParents(region.id);

				if (tp) {
					region.parent = tp;
				}

				result.push(region);
			}
		}

		cb(null, result);
	});
};

/**
 * Get list of territories
 *
 * @param obj options -
 * @param func cb(err, result) - result like [{'iso3166_1_num': 4, 'iso3166_1_alpha_3': 'AFG', 'iso3166_1_alpha_2': 'AF', 'label': 'Afghanistan'}]
 */
Geodata.prototype.getTerritories = function getTerritories(options, cb) {
	const	dbFields	= [],
		that	= this;

	let	sql;

	if (typeof options === 'function') {
		cb	= options;
		options	= {};
	}

	if (options.labelLang === undefined) {
		options.labelLang	= that.labelLang;
	}

	sql = 'SELECT territories.*, labels.label FROM geo_territories territories LEFT JOIN geo_territoryLabels labels ON labels.terIso3166_1_alpha_2 = territories.iso3166_1_alpha_2 ';

	if (options.labelLang !== false && options.labelLang !== undefined) {
		sql += ' AND labels.labelIso639_3 = ?';
		dbFields.push(options.labelLang);
	}

	sql += ' WHERE 1 = 1';

	for (let key of ['iso3166_1_num', 'iso3166_1_alpha_2', 'iso3166_1_alpha_3']) {
		if (options[key] === undefined) {
			continue;
		} else if ( ! (options[key] instanceof Array)) {
			options[key] = [options[key]];
		}

		if (options[key].length === 0) {
			sql += ' AND 1 = 2';
			continue;
		}

		sql += ' AND territories.' + key + ' IN (';
		for (let i = 0; options[key][i] !== undefined; i ++) {
			sql += '?,';
			dbFields.push(options[key][i]);
		}

		sql	= sql.substring(0, sql.length - 1) + ')';
	}

	sql += ' ORDER BY labels.label, territories.iso3166_1_alpha_2';

	this.ready(function () {
		that.db.query(sql, dbFields, cb);
	});
};

exports = module.exports = Geodata;
