'use strict';

const async = require('async');

exports = module.exports = async function (options) {
	const tasks = [];
	const {db} = options;

	// Expected table names (lower case!)
	let expectedTableNames =
		[
			'geo_currencylables',
			'geo_langlabels',
			'geo_territorylabels',
		];

	if (expectedTableNames.length > 0) {
		let tableNames = [];
		let renameTableNames = [];

		// Get all tables from list expectedTableNames
		tasks.push(async function () {
			const {rows} = await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = ?', db.options.database);

			let resultTablesLowerCase = rows.map(r => r.table_name.toLowerCase());
			let missingTables = [];

			for (let i = 0; i < rows.length; i++) {
				if (expectedTableNames.indexOf(rows[i].table_name.toLowerCase()) !== -1) {
					tableNames.push(rows[i].table_name);
				}
			}

			for (let i = 0; i < expectedTableNames.length; i++) {
				if (resultTablesLowerCase.indexOf(expectedTableNames[i]) === -1) {
					missingTables.push(expectedTableNames[i]);
				}
			}

			if (missingTables.length !== 0) {
				throw new Error('Tables missing: ' + missingTables.join(', '));
			}
		});

		// Get table names with any upper case
		tasks.push(function (cb) {
			for (let i = 0; tableNames[i] !== undefined; i++) {
				if (tableNames[i] !== tableNames[i].toLowerCase()) {
					renameTableNames.push(tableNames[i]);
				}
			}
			cb();
		});

		// Rename tables
		tasks.push(async function () {
			const tasks = [];

			for (let i = 0; renameTableNames[i] !== undefined; i++) {
				const tableName = renameTableNames[i];
				const newTableName = tableName.toLowerCase();

				tasks.push(async function () {
					await db.query('RENAME TABLE `' + tableName + '` TO `' + newTableName + '`');
				});
			}
			await async.parallel(tasks);
		});

		await async.series(tasks);
	}
};
