
'use strict';

const async = require('async');

exports = module.exports = function (cb) {
	const that = this,
		tasks = [];

	// Expected table names (lower case!)
	let expectedTableNames =
		[
			'geo_currencylables',
			'geo_langlabels',
			'geo_territorylabels'
		];

	if (expectedTableNames.length > 0) {
		let tableNames = [];

		// Get all tables from list expectedTableNames
		tasks.push(function (cb) {
			that.options.dbDriver.query('SELECT table_name FROM information_schema.tables where LOWER(table_name) IN("' + expectedTableNames.join('","') + '")', function (err, rows) {
				if (err) return cb(err);

				let resultTables = rows.map(r => r.table_name.toLowerCase()),
					missingTables = [];

				tableNames = rows.map(r => r.table_name);

				for (let i = 0; i < expectedTableNames.length; i ++) {
					if (resultTables.indexOf(expectedTableNames[i]) === - 1) {
						missingTables.push(expectedTableNames[i]);
					}
				}
				if (missingTables.length !== 0) {
					err = new Error('Tables missing: ' + missingTables.join(', '));

					return cb(err);
				}

				for (let i = 0; i < resultTables.length; i ++) {
					if (expectedTableNames.indexOf(resultTables[i]) === - 1) {
						missingTables.push(resultTables[i]);
					}
				}
				if (missingTables.length !== 0) {
					err = new Error('Tables missing: ' + missingTables.join(', '));
				}

				cb(err);
			});
		});

		// Rename tables
		tasks.push(function (cb) {
			const tasks = [];

			for (let i = 0; tableNames[i] !== undefined; i ++) {
				const tableName = tableNames[i],
					newTableName = tableName.toLowerCase();

				tasks.push(function (cb) {
					that.options.dbDriver.query('RENAME TABLE `' + tableName + '` to `' + newTableName + '`', cb);
				});
			}
			async.parallel(tasks, cb);
		});

		async.series(tasks, cb);
	}
};
