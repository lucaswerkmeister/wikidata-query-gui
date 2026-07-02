'use strict';
const assert = require( 'assert' );

describe( 'embed.html', () => {
	it( 'loads results for query', async () => {
		const query = `
			SELECT ?item ?itemLabel ?other WHERE {
			 VALUES (?item ?itemLabel ?other) {
			     (wd:Q42 "Douglas Adams"@en "1952-03-11T00:00:00Z"^^xsd:dateTime)
			     (wd:Q80 "Tim Berners-Lee"@de <http://commons.wikimedia.org/wiki/Special:FilePath/Sir%20Tim%20Berners-Lee%20%28cropped%29.jpg>)
			} }`;

		const url = browser.options.baseUrl + '/embed?q1=clear.html#' + encodeURI( query );
		browser.url( url );

		const results = $( '#query-result' );
		await results.waitForDisplayed();

		const resultHeaders = await results.$( 'tr' ).getText();
		assert( resultHeaders.includes( 'item' ) );
		assert( resultHeaders.includes( 'other' ) );
		assert( resultHeaders.includes( 'itemLabel' ) );
	} );

	it( 'loads results for query and displays a chart', async () => {
		const query = `
			#defaultView:AreaChart
			SELECT ?year ?population WHERE {
				VALUES (?year ?population) {
                  ("1960-01-01T00:00:00Z"^^xsd:dateTime 280000)
                  ("1970-01-01T00:00:00Z"^^xsd:dateTime 360000)
                  ("1980-01-01T00:00:00Z"^^xsd:dateTime 350000)
                  ("1990-01-01T00:00:00Z"^^xsd:dateTime 400000)
                  ("2000-01-01T00:00:00Z"^^xsd:dateTime 460000)
                  ("2010-01-01T00:00:00Z"^^xsd:dateTime 500000)
                }
			}
			ORDER BY ?year`;
		const url = browser.options.baseUrl + '/embed.html?q2=clear#' + encodeURI( query );
		browser.url( url );
		const loading = $( 'span.loading-text' );
		await loading.waitForDisplayed( { reverse: true } );

		const results = $( '#query-result' );
		await results.waitForDisplayed();

		await expect( results.$( 'svg g.dimple-chart' ) ).toExist();
	} );
} );
