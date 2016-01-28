'use strict';

var cheerio = require('cheerio'),
    async   = require('async'),
    fs      = require('fs'),
    db      = require('larvitdb');

exports = module.exports = function(cb) {
	var dbFields,
	    files,
	    sql,
	    i;

	files = fs.readdirSync(__dirname + '/../cldrData/common/main');

	// Make sure all language files exists in the database
	sql      = 'INSERT IGNORE INTO geo_languages VALUES';
	dbFields = [];
	for (i = 0; files[i] !== undefined; i ++) {
		sql += '(?),';
		dbFields.push(files[i].substring(0, files[i].length - 4));
	}
	sql = sql.substring(0, sql.length - 1) + ';';

	db.query(sql, dbFields, function(err) {
		var tasks = [],
		    lang,
		    $;

		if (err) {
			cb(err);
			return;
		}

		function addSqlTask(sql, dbFields) {
			tasks.push(function(cb) {
				db.query(sql, dbFields, cb);
			});
		}

		for (i = 0; files[i] !== undefined; i ++) {
			lang = files[i].substring(0, files[i].length - 4);

			$ = cheerio.load(fs.readFileSync(__dirname + '/../cldrData/common/main/' + files[i]), {'xmlMode': true});

			$('ldml > localeDisplayNames > languages > language').each(function() {
				addSqlTask('INSERT IGNORE INTO geo_languages VALUES(?),(?);', [lang, $(this).attr('type')]);
				if ( ! $(this).attr('alt')) {
					addSqlTask('INSERT IGNORE INTO geo_languageNames VALUES(?,?,?);', [$(this).attr('type'), lang, $(this).text()]);
				}
			});
		}

		async.series(tasks, cb);
	});
};