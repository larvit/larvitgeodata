'use strict';

const cheerio = require('cheerio'),
	async   = require('async'),
	fs      = require('fs'),
	db      = require('larvitdb');

exports = module.exports = function(cb) {
	const dbIso3To2 = {},
	      dbIso2To3 = {},
	      tasks     = [];

	// Fetch all database languages
	tasks.push(function(cb) {
		db.query('SELECT iso639_3, iso639_1 FROM geo_langs', function(err, rows) {
			if (err) {
				cb(err);
				return;
			}

			for (let i = 0; rows[i] !== undefined; i ++) {
				dbIso3To2[rows[i].iso639_3] = rows[i].iso639_1;
				dbIso2To3[rows[i].iso639_1] = rows[i].iso639_3;
			}

			cb();
		});
	});

	// Insert language display names
	tasks.push(function(cb) {
		const dbFields = [],
		      files    = fs.readdirSync(__dirname + '/../cldrData/common/main');

		var sql = 'INSERT INTO geo_langLabels VALUES';

		for (let i = 0; files[i] !== undefined; i ++) {
			let $         = cheerio.load(fs.readFileSync(__dirname + '/../cldrData/common/main/' + files[i]), {'xmlMode': true}),
			    labelLang = files[i].substring(0, files[i].length - 4);

			if (labelLang.length === 2 && dbIso2To3[labelLang] !== undefined)
				labelLang = dbIso2To3[labelLang];

			$('ldml > localeDisplayNames > languages > language').each(function() {
				if ( ! $(this).attr('alt')) {
					let lang = $(this).attr('type');

					if (lang.length === 2 && dbIso2To3[lang] !== undefined)
						lang = dbIso2To3[lang];

					if (dbIso3To2[labelLang] !== undefined && dbIso3To2[lang] !== undefined) {
						sql += '(?,?,?),';
						dbFields.push(lang);
						dbFields.push(labelLang);
						dbFields.push($(this).text());
					}
				}
			});
		}

		sql = sql.substring(0, sql.length - 1);
		db.query(sql, dbFields, cb);
	});

	async.series(tasks, cb);
};