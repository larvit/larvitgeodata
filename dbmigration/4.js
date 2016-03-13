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

	// Insert territory display names
	tasks.push(function(cb) {
		const dbFields = [],
		      labels   = new Map(),
		      files    = fs.readdirSync(__dirname + '/../cldrData/common/main');

		var sql = 'INSERT INTO geo_territoryLabels VALUES';

		for (let i = 0; files[i] !== undefined; i ++) {
			let $            = cheerio.load(fs.readFileSync(__dirname + '/../cldrData/common/main/' + files[i]), {'xmlMode': true}),
			    labelLang    = files[i].substring(0, files[i].length - 4),
			    labelLangMap = new Map();

			if (labelLang.length === 2 && dbIso2To3[labelLang] !== undefined)
				labelLang = dbIso2To3[labelLang];

			if (dbIso3To2[labelLang] === undefined)
				continue;

			labels.set(labelLang, labelLangMap);

			$('ldml > localeDisplayNames > territories > territory').each(function() {
				let labelMap = new Map([['label', null], ['labelShort', null]]);

				labelLangMap.set($(this).attr('type'), labelMap);

				if ($(this).attr('alt') === 'short') {
					labelMap.set('labelShort', $(this).text());
				} else {
					labelMap.set('label',      $(this).text());
				}
			});
		}

		labels.forEach(function(value, ) {

			console.log(key + ': ' + value);
		});

		//console.log(labels);

		//sql = sql.substring(0, sql.length - 1);
		//db.query(sql, dbFields, cb);
	});

	async.series(tasks, cb);
};