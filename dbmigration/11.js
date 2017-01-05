'use strict';

const cheerio	= require('cheerio'),
      async	= require('async'),
      fs	= require('fs'),
      db      = require('larvitdb');

exports = module.exports = function(cb) {
    const tasks = [];
    let $ = cheerio.load(fs.readFileSync(__dirname + '/../cldrData/common/bcp47/currency.xml'), {'xmlMode': true});

    tasks.push(function(cb){
        let sql = 'INSERT INTO `geo_currencies` (`iso_4217`) VALUES ',
            dbFields    = [];

		$('ldmlBCP47 > keyword > key[alias=currency] type').each(function() {
            sql += '(?),';
            dbFields.push($(this).attr('name'));
        });

        sql = sql.substring(0, sql.length - 1);
		db.query(sql, dbFields, cb);
    });

    tasks.push(function(cb){
        let sql = 'INSERT INTO `geo_currencyDescriptions` (`iso_4217`, `description`) VALUES ',
            dbFields    = [];

		$('ldmlBCP47 > keyword > key[alias=currency] type').each(function() {
            sql += '(?, ?),';
            dbFields.push($(this).attr('name'));
            dbFields.push($(this).attr('description'));
        });

        sql = sql.substring(0, sql.length - 1);
		db.query(sql, dbFields, cb);
    });

    tasks.push(function(cb){
        const dbFields = [],
		      files    = fs.readdirSync(__dirname + '/../cldrData/common/main'),
              regex = new RegExp('^([a-z]){2}.xml');

        let sql = 'INSERT INTO `geo_currencyLables` (`iso_4217`, `displayName`, `symbol`, `langIso639_1`) VALUES ';

        for (let i = 0; files[i] !== undefined; i ++) {
            if(regex.test(files[i])){
                let $ = cheerio.load(fs.readFileSync(__dirname + '/../cldrData/common/main/' + files[i]), {'xmlMode': true});

                $('ldml > numbers > currencies > currency').each(function() {
                    
                    dbFields.push($(this).attr('type').toLowerCase());
                    dbFields.push($(this).children('displayName').first().text()); //second and thrid displayName is counting conjugations

                    //some languages have multiple/alternate symbols and some have none
                    if($(this).children('symbol').length > 0){
                        sql += '(?,?,?,?),';
                        dbFields.push(($(this).children('symbol').first().text()));
                    } else {
                        sql += '(?,?,NULL,?),';
                    }
                    
                    dbFields.push(files[i].substring(0, 2));
                });
            }
        }

        sql = sql.substring(0, sql.length - 1);
		db.query(sql, dbFields, cb);
    });

    async.series(tasks, cb);
};