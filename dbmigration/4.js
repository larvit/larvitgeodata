'use strict';

const cheerio = require('cheerio'),
      async   = require('async'),
      fs      = require('fs'),
      db      = require('larvitdb');

exports = module.exports = function(cb) {
	const dbIso3To2 = new Map(),
	      dbIso2To3 = new Map(),
	      dbTers    = [],
	      tasks     = [];

	// Fetch all database languages
	tasks.push(function(cb) {
		db.query('SELECT iso639_3, iso639_1 FROM geo_langs', function(err, rows) {
			if (err) {
				cb(err);
				return;
			}

			for (let i = 0; rows[i] !== undefined; i ++) {
				dbIso3To2.set(rows[i].iso639_3, rows[i].iso639_1);
				dbIso2To3.set(rows[i].iso639_1, rows[i].iso639_3);
			}

			cb();
		});
	});

	// Fetch all ter codes
	tasks.push(function(cb) {
		db.query('SELECT iso3166_1_alpha_2 FROM geo_territories', function(err, rows) {
			if (err) {
				cb(err);
				return;
			}

			for (let i = 0; rows[i] !== undefined; i ++)
				dbTers.push(rows[i].iso3166_1_alpha_2);

			cb();
		});
	});

	// Insert territory display names
	tasks.push(function(cb) {
		const sqlTasks = [],
		      labels   = new Map(),
		      preSql   = 'INSERT INTO geo_territoryLabels VALUES',
		      files    = fs.readdirSync(__dirname + '/../cldrData/common/main');

		for (let i = 0; files[i] !== undefined; i ++) {
			let $            = cheerio.load(fs.readFileSync(__dirname + '/../cldrData/common/main/' + files[i]), {'xmlMode': true}),
			    labelLang    = files[i].substring(0, files[i].length - 4),
			    labelLangMap = new Map();

			if (labelLang.length === 2 && dbIso2To3.get(labelLang) !== undefined)
				labelLang = dbIso2To3.get(labelLang);

			if (dbIso3To2.get(labelLang) === undefined)
				continue;

			labels.set(labelLang, labelLangMap);

			$('ldml > localeDisplayNames > territories > territory').each(function() {
				const terCode = $(this).attr('type');

				if (dbTers.indexOf(terCode) !== - 1) {
					let labelMap;

					if (labelLangMap.get(terCode) === undefined) {
						labelMap = new Map([['label', null], ['labelShort', null]]);

						labelLangMap.set(terCode, labelMap);
					} else {
						labelMap = labelLangMap.get(terCode);
					}

					if ($(this).attr('alt') === 'short') {
						labelMap.set('labelShort', $(this).text());
					} else {
						labelMap.set('label', $(this).text());
					}
				}
			});
		}

		labels.forEach(function(langLabels, langCode) {
			const dbFields = [];

			let sql = preSql;

			langLabels.forEach(function(labelVersions, terCode) {
				sql += '(?,?,?,?),';
				dbFields.push(terCode);
				dbFields.push(langCode);
				dbFields.push(labelVersions.get('label'));
				dbFields.push(labelVersions.get('labelShort'));
			});

			sql = sql.substring(0, sql.length - 1);
			sqlTasks.push(function(cb) {
				db.query(sql, dbFields, cb);
			});
		});

		async.parallel(sqlTasks, cb);
	});

	async.series(tasks, cb);
};