[![Build Status](https://github.com/larvit/larvitgeodata/actions/workflows/ci.yml/badge.svg)](https://github.com/larvit/larvitgeodata/actions)

# larvitgeodata
Node module for geo data, primarily ISO territories, languages etc

## Installation

```bash
npm i larvitgeodata;
```

## Usage

In your start script file, run this:

```javascript
const Geo = require('larvitgeodata');
const DB = require('larvitdb');
const { Log } = require('larvitutils');

let	geo;

const db = new Db({...}); // See https://github.com/larvit/larvitdb for details on how to configure the database

geo = new Geo({
	db,

	// Optional
	'log':	new Log('info')
});

await geo.ready(); // Throws on error
// Database is full, do cool stuff with it.

```

### Territories

```javascript
const result = await geo.getTerritories(); // Throws on error
// result:
// [{'iso3166_1_num': 4, 'iso3166_1_alpha_3': 'AFG', 'iso3166_1_alpha_2': 'AF', 'label': 'Afghanistan'},...]
```

### Languages

```javascript
const result = geo.getLanguages(); // Throws on error
// Example result:
// [{'iso639_3': 'aar', 'iso639_1': 'aa', 'type': 'living', 'scope': 'individual', 'label': 'Afar'},...]
```

### Different label languages

The lists can show labels on different languages, here are some examples:

```javascript
const result = await geo.getTerritories({'labelLang': 'swe'}); // Throws on error
// result:
// [...,{'iso3166_1_num': 166, 'iso3166_1_alpha_3': 'CCK', 'iso3166_1_alpha_2': 'CC', 'label': 'Kokosöarna'},...]
```

### Currencies

Returns a list of currencies with iso4217 code with a localized display name and symbol and/or an english "description" that is similar to display name. "labelLang" expects the iso 639-1 iso code of the language.

```javascript
const result = await geo.getCurrencies({'labelLang': 'en', 'descriptions': false}); // Throws on error
// result:
// "[...,{"iso_4217":"adp","description":"Andorran Peseta","symbol":null,"displayName":"Andorran Peseta"},...]
```
