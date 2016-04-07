'use strict';

const assert = require('assert'),
      async  = require('async'),
      log    = require('winston'),
      db     = require('larvitdb'),
      fs     = require('fs');

// Set up winston
log.remove(log.transports.Console);
log.add(log.transports.Console, {
	'level':     'warn',
	'colorize':  true,
	'timestamp': true,
	'json':      false
});

describe('Basic (takes long time to build database)', function() {

	// Make sure the database is set up
	before(function(done) {
		var confFile;

		// Let this test take some time
		this.timeout(60000);
		this.slow(3000);

		// Check for empty db
		function checkTables() {
			db.query('SHOW TABLES', function(err, rows) {
				if (err) {
					log.error(err);
					process.exit(1);
				}

				if (rows.length) {
					log.error('Database is not empty. To make a test, you must supply an empty database!');
					process.exit(1);
				}

				require(__dirname + '/../index.js')(function(err) {
					assert( ! err, 'err should be negative');

					done();
				});
			});
		}

		function runDbSetup(confFile) {
			log.verbose('DB config: ' + JSON.stringify(require(confFile)));

			db.setup(require(confFile), function(err) {
				assert( ! err, 'err should be negative');

				checkTables();
			});
		}

		if (process.argv[3] === undefined)
			confFile = __dirname + '/../config/db_test.json';
		else
			confFile = process.argv[3].split('=')[1];

		log.verbose('DB config file: "' + confFile + '"');

		fs.stat(confFile, function(err) {
			const altConfFile = __dirname + '/../config/' + confFile;

			if (err) {
				log.info('Failed to find config file "' + confFile + '", retrying with "' + altConfFile + '"');

				fs.stat(altConfFile, function(err) {
					if (err)
						assert( ! err, 'fs.stat failed: ' + err.message);

					if ( ! err)
						runDbSetup(altConfFile);
				});
			} else {
				runDbSetup(confFile);
			}
		});
	});

	// Tear down the database
	after(function(done) {
		db.removeAllTables(done);
	});

	it('Check for Sweden', function(done) {
		db.query('SELECT * FROM geo_territories WHERE iso3166_1_alpha_2 = \'SE\'', function(err, rows) {
			assert( ! err, 'err should be negative');
			assert(rows.length === 1, 'There should be exactly one row');
			assert(rows[0].iso3166_1_num === 752, 'Swedens numeric code is 752');

			done();
		});
	});

	it('Check for Swedish language label', function(done) {
		db.query('SELECT * FROM geo_langLabels WHERE langIso639_3 = \'swe\' AND labelIso639_3 = \'swe\'', function(err, rows) {
			assert( ! err, 'err should be negative');
			assert(rows.length === 1, 'There should be exactly one row');
			assert(rows[0].label === 'svenska', 'The correct label should be "svenska", but is "' + rows[0].label + '"');

			done();
		});
	});

	it('Check for Swedish territory label', function(done) {
		db.query('SELECT * FROM geo_territoryLabels WHERE labelIso639_3 = \'swe\' AND terIso3166_1_alpha_2 = \'SE\'', function(err, rows) {
			assert( ! err, 'err should be negative');
			assert.deepEqual(rows.length, 1);
			assert(rows[0].label === 'Sverige', 'The correct label should be "Sverige", but is "' + rows[0].label + '"');

			done();
		});
	});
});