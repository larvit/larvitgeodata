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
	// Database is full, do cool stuff with it.
});
```

### Territories

```javascript
geo.getTerritories(function(err, result) {
	// result:
	// [{'iso3166_1_num': 4, 'iso3166_1_alpha_3': 'AFG', 'iso3166_1_alpha_2': 'AF', 'label': 'Afghanistan'},...]
});
```

### Languages

```javascript
geo.getLanguages(function(err, result) {
	// result:
	// [{'iso639_3': 'aar', 'iso639_1': 'aa', 'type': 'living', 'scope': 'individual', 'label': 'Afar'},...]
});
```

### Different label languages

The lists can show labels on different languages, here are some examples:

```javascript
geo.getTerritories({'labelLang': 'swe'}, function(err, result) {
	// result:
	// [...,{'iso3166_1_num': 166, 'iso3166_1_alpha_3': 'CCK', 'iso3166_1_alpha_2': 'CC', 'label': 'Kokosöarna'},...]
});
```