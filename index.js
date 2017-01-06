'use strict';

const	events	= require('events'),
	eventEmitter	= new events.EventEmitter(),
	dbmigration	= require('larvitdbmigration')({'tableName': 'geo_db_version', 'migrationScriptsPath': __dirname + '/dbmigration'}),
	log	= require('winston'),
	db	= require('larvitdb');

let	dbChecked	= false;

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

//options liek {'descriptions': true, 'labelLang': 'sv'} or null for just currency codes
function getCurrencies(options, cb) {

	const dbFields	= [];
	let sql;

	//just currency codes
	if(! options || (! options.descriptions && ! options.labelLang)) {
		sql = 'SELECT iso_4217 FROM `geo_currencies`';
	} else {

		if(options.descriptions && ! options.labelLang) {
			sql = 'SELECT * FROM `geo_currencies`';
		} 

		if(options.labelLang && ! options.descriptions) {
			sql = 'SELECT c.iso_4217, cl.symbol, cl.displayName FROM `geo_currencies` c  JOIN `geo_currencyLables` cl on c.iso_4217 = cl.iso_4217 WHERE cl.langIso639_1 = ?';
			dbFields.push(options.labelLang);
		}

		if(options.descriptions && options.labelLang){
			sql = 'SELECT c.iso_4217, c.description, cl.symbol, cl.displayName FROM `geo_currencies` c JOIN `geo_currencyLables` cl on c.iso_4217 = cl.iso_4217 WHERE cl.langIso639_1 = ?';
			dbFields.push(options.labelLang);		
		}
	}

	ready(function() {
		db.query(sql, dbFields, cb);
	});
}

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
		cb	= options;
		options	= {};
	}

	if (options.gotIso639_1	=== undefined) options.gotIso639_1	= true;
	if (options.labelLang	=== undefined) options.labelLang	= exports.labelLang;
	if (options.scope	=== undefined) options.scope	= 'individual';
	if (options.type	=== undefined) options.type	= 'living';

	if (options.iso639_3 !== undefined && ! (options.iso639_3 instanceof Array)) {
		options.iso639_3 = [options.iso639_3];
	}

	if (options.iso639_1 !== undefined && ! (options.iso639_1 instanceof Array)) {
		options.iso639_1 = [options.iso639_1];
	}

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
		sql += ' AND langs.iso639_1 IN (';

		for (let i = 0; options.iso639_1[i] !== undefined; i ++) {
			sql += '?,';
			dbFields.push(options.iso639_1[i]);
		}

		sql = sql.substring(0, sql.length - 1) + ')';
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
		cb	= options;
		options	= {};
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

		sql = sql.substring(0, sql.length - 1) + ')';
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

exports.getCurrencies	= getCurrencies;
exports.getLanguages	= getLanguages;
exports.getTerritories	= getTerritories;
exports.ready	= ready;
