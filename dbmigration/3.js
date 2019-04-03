
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
		let tableNames = [],
			renameTableNames = [];

		// Get all tables from list expectedTableNames
		tasks.push(function (cb) {
			that.options.dbDriver.query('SELECT table_name FROM information_schema.tables WHERE table_schema = ?', that.options.dbDriver.conf.database, function (err, rows) {
				if (err) return cb(err);

				let resultTablesLowerCase = rows.map(r => r.table_name.toLowerCase()),
					missingTables = [];

				for (let i = 0; i < rows.length; i ++) {
					if (expectedTableNames.indexOf(rows[i].table_name.toLowerCase()) !== - 1) {
						tableNames.push(rows[i].table_name);
					}
				}

				for (let i = 0; i < expectedTableNames.length; i ++) {
					if (resultTablesLowerCase.indexOf(expectedTableNames[i]) === - 1) {
						missingTables.push(expectedTableNames[i]);
					}
				}

				if (missingTables.length !== 0) {
					err = new Error('Tables missing: ' + missingTables.join(', '));
				}

				cb(err);
			});
		});

		// Get table names with any upper case
		tasks.push(function (cb) {
			for (let i = 0; tableNames[i] !== undefined; i ++) {
				if (tableNames[i] !== tableNames[i].toLowerCase()) {
					renameTableNames.push(tableNames[i]);
				}
			}
			cb();
		});

		// Rename tables
		tasks.push(function (cb) {
			const tasks = [];

			for (let i = 0; renameTableNames[i] !== undefined; i ++) {
				const tableName = renameTableNames[i],
					newTableName = tableName.toLowerCase();

				tasks.push(function (cb) {
					that.options.dbDriver.query('RENAME TABLE `' + tableName + '` TO `' + newTableName + '`', cb);
				});
			}
			async.parallel(tasks, cb);
		});

		async.series(tasks, cb);
	}
};
