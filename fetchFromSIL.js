'use strict';
const	request	= require('request');

request('http://www-01.sil.org/iso639-3/codes.asp?order=scope&letter=%25', function (err, res, body) {
	let	$table,
		$,
		iso639_1,
		iso639_3,
		scope,
		type,
		node,
		tdNr,
		i2,
		i;

	if (err) return cb(err);

	if (res.statusCode !== 200) {
		cb(new Error('Invalid response code from SIL. Got: ' + res.statusCode));
		return;
	}

	$	= cheerio.load(body);
	$table	= $('#main').find('table')[0];
	sql	= 'INSERT INTO geo_langs VALUES';
	dbFields	= [];

	for (i = 0; $table.children[i] !== undefined; i ++) {
		if ($table.children[i].name === 'tr') {
			iso639_1	= null;
			iso639_3	= null;
			scope	= null;
			type	= null;
			tdNr	= 0;

			for (i2 = 0; $table.children[i].children[i2] !== undefined; i2 ++) {
				node = $table.children[i].children[i2];
				if (node.name === 'td') {
					if (tdNr === 0 && node.children.length) {
						iso639_3 = node.children[0].data;
					} else if (tdNr === 2 && node.children.length) {
						iso639_1 = node.children[0].data;
					} else if (tdNr === 4) {
						scope = node.children[0].children[0].data.toLowerCase();
					} else if (tdNr === 5) {
						if (node.children.length && node.children[0].children.length) {
							type = node.children[0].children[0].data.toLowerCase();
						} else {
							type = 'undefined';
						}
					}

					tdNr ++;
				}
			}

			if (iso639_3 !== null) {
				sql += '(?,?,?,?),';
				dbFields.push(iso639_1);
				dbFields.push(iso639_3);
				dbFields.push(type);
				dbFields.push(scope);
			}
		}
	}

	sql = sql.substring(0, sql.length - 1);
	db.query(sql, dbFields, cb);
});
