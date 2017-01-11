[![Build Status](https://travis-ci.org/larvit/larvitgeodata.svg?branch=master)](https://travis-ci.org/larvit/larvitgeodata) [![Dependencies](https://david-dm.org/larvit/larvitgeodata.svg)](https://david-dm.org/larvit/larvitgeodata.svg)

# larvitgeodata
Node module for geo data, primarily ISO territories, languages etc

## Installation

```bash
npm i larvitgeodata;
```

## Usage

In your start script file, run this:

```javascript
const geo = require('larvitgeodata');

geo.ready(function(err) {
	if (err) throw err;
	// Database is full, do cool stuff with it.
});
```

### Territories

```javascript
geo.getTerritories(function(err, result) {
	if (err) throw err;
	// result:
	// [{'iso3166_1_num': 4, 'iso3166_1_alpha_3': 'AFG', 'iso3166_1_alpha_2': 'AF', 'label': 'Afghanistan'},...]
});
```

### Languages

```javascript
geo.getLanguages(function(err, result) {
	if (err) throw err;
	// Example result:
	// [{'iso639_3': 'aar', 'iso639_1': 'aa', 'type': 'living', 'scope': 'individual', 'label': 'Afar'},...]
});
```

### Different label languages

The lists can show labels on different languages, here are some examples:

```javascript
geo.getTerritories({'labelLang': 'swe'}, function(err, result) {
	if (err) throw err;
	// result:
	// [...,{'iso3166_1_num': 166, 'iso3166_1_alpha_3': 'CCK', 'iso3166_1_alpha_2': 'CC', 'label': 'Kokosöarna'},...]
});
```

### Currencies

Returns a list of currencies with iso4217 code with a localized display name and symbol and/or an english "description" that is similar to display name. "labelLang" expects the iso 639-1 iso code of the language.

```javascript
geo.getCurrencies({'labelLang': 'en', 'descriptions': false}, function(err, result) {
	if (err) throw err;
	// result:
	// "[...,{"iso_4217":"adp","description":"Andorran Peseta","symbol":null,"displayName":"Andorran Peseta"},...]
});
```