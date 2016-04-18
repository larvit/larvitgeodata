'use strict';

const db           = require('larvitdb'),
      log          = require('winston'),
      events       = require('events'),
      dbmigration  = require('larvitdbmigration')({'tableName': 'geo_db_version', 'migrationScriptsPath': __dirname + '/dbmigration'}),
      eventEmitter = new events.EventEmitter();

let dbChecked = false;

// What language to use for lables
exports.labelLang = 'eng';

// Handle database migrations
dbmigration(function(err) {
	if (err) {
		log.error('larvitgeodata: Database error: ' + err.message);
		return;
	}

	dbChecked = true;
	eventEmitter.emit('checked');
});

/**
 * Get list of languages
 *
 * @param obj options -
 * @param func cb(err, result) - result like [{'iso639_3': 'aar', 'iso639_1': 'aa', 'type': 'living', 'scope': 'individual', 'label': 'Afar'}]
 */
function getLanguages(options, cb) {
	const dbFields = [];

	let sql;

	if (typeof options === 'function') {
		cb      = options;
		options = {};
	}

	if (options.gotIso639_1 === undefined) options.gotIso639_1 = true;
	if (options.labelLang   === undefined) options.labelLang   = exports.labelLang;
	if (options.scope       === undefined) options.scope       = 'individual';
	if (options.type        === undefined) options.type        = 'living';

	sql = 'SELECT langs.*, labels.label FROM geo_langs langs LEFT JOIN geo_langLabels labels ON labels.langIso639_3 = langs.iso639_3 ';

	if (options.labelLang !== false && options.labelLang !== undefined) {
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
		sql += ' AND langs.iso639_1 = ?';
		dbFields.push(options.iso639_1);
	}

	if (options.iso639_3 !== undefined) {
		sql += ' AND langs.iso639_3 = ?';
		dbFields.push(options.iso639_3);
	}

	sql += ' ORDER BY labels.label, langs.iso639_3';

	ready(function() {
		db.query(sql, dbFields, cb);
	});
}

/**
 * Get list of territories
 *
 * @param obj options -
 * @param func cb(err, result) - result like [{'iso3166_1_num': 4, 'iso3166_1_alpha_3': 'AFG', 'iso3166_1_alpha_2': 'AF', 'label': 'Afghanistan'}]
 */
function getTerritories(options, cb) {
	const dbFields = [];

	let sql;

	if (typeof options === 'function') {
		cb      = options;
		options = {};
	}

	if (options.labelLang === undefined) {
		options.labelLang = exports.labelLang;
	}

	sql = 'SELECT territories.*, labels.label FROM geo_territories territories LEFT JOIN geo_territoryLabels labels ON labels.terIso3166_1_alpha_2 = territories.iso3166_1_alpha_2 ';

	if (options.labelLang !== false && options.labelLang !== undefined) {
		sql += ' AND labels.labelIso639_3 = ?';
		dbFields.push(options.labelLang);
	}

	sql += ' WHERE 1 = 1';

	if (options.iso3166_1_num !== undefined) {
		sql += ' AND territories.iso3166_1_num = ?';
		dbFields.push(options.iso3166_1_num);
	}

	if (options.iso3166_1_alpha_3 !== undefined) {
		sql += ' AND territories.iso3166_1_alpha_3 = ?';
		dbFields.push(options.iso3166_1_alpha_3);
	}

	if (options.iso3166_1_alpha_2 !== undefined) {
		sql += ' AND territories.iso3166_1_alpha_2 = ?';
		dbFields.push(options.iso3166_1_alpha_2);
	}

	sql += ' ORDER BY labels.label, territories.iso3166_1_alpha_2';

	ready(function() {
		db.query(sql, dbFields, cb);
	});
}

function ready(cb) {
	if (dbChecked) {
		cb();
		return;
	}

	eventEmitter.on('checked', cb);
}

exports.getLanguages   = getLanguages;
exports.getTerritories = getTerritories;
exports.ready          = ready;

