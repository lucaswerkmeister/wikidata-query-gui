'use strict';
const { config: mwConfig } = require( 'wdio-mediawiki/wdio-defaults.conf.js' );

exports.config = {
	...mwConfig,

	//
	// ==================
	// Specify Test Files
	// ==================
	// Define which test specs should run. The pattern is relative to the directory
	// of the wdio.conf.js file (since v8).
	//
	specs: [
		'./**/*.js'
	],

	baseUrl: 'http://localhost:8082',

	waitforTimeout: 10000,

	connectionRetryTimeout: 90000,

	connectionRetryCount: 3,

	reporters: [ 'spec' ]

};
