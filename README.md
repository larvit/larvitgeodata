# larvitgeodata
Node module for geo data, primarily ISO territories, languages etc

Currently only reading into the database, no javascript interface.

## Installation

```bash
npm i larvitgeodata;
```

## Usage

In your start script file, run this:

```javascript
var geo = require('larvitgeodata');

geo(function() {
	// Database is full, do cool stuff with it.
});
```