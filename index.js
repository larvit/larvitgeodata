'use strict';

const log          = require('winston'),
      events       = require('events'),
      dbmigration  = require('larvitdbmigration')({'tableName': 'geo_db_version', 'migrationScriptsPath': __dirname + '/dbmigration'}),
      eventEmitter = new events.EventEmitter();

var dbChecked = false;

// Handle database migrations
dbmigration(function(err) {
	if (err) {
		log.error('larvitgeodata: Database error: ' + err.message);
		return;
	}

	dbChecked = true;
	eventEmitter.emit('checked');
});

exports = module.exports = function(cb) {
	if (dbChecked) {
		cb();
		return;
	}

	eventEmitter.on('checked', cb);
};