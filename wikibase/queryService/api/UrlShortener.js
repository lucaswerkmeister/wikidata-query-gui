var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.UrlShortener = ( function ( $ ) {
	'use strict';

	/*
	 * Service callback factories.
	 * Given a configuration object, they return a callback which accepts a URL
	 * and returns either HTML or a promise resolving to the shortened URL.
	 */
	var SERVICE_PROVIDER_FACTORIES = {
		'tinyurl': function ( _config ) {
			return function ( url ) {
				return this._getTinyUrl( url );
			};
		},
		'urlshortener': function ( config ) {
			let apiUrl;
			const anonymous = 'anonymous' in config ? config.anonymous : true;
			if ( config.host ) {
				apiUrl = 'https://' + config.host + '/w/api.php';
			} else if ( config.apiUrl ) {
				apiUrl = config.apiUrl;
			} else {
				return this._badService;
			}
			return function ( url ) {
				return this._getWikiShort( url, apiUrl, anonymous );
			};
		}
	};

	/*
	 * Legacy urlShortener config values (strings instead of objects).
	 */
	var LEGACY_SERVICE_PROVIDERS = {
		'tinyurl': SERVICE_PROVIDER_FACTORIES.tinyurl(),
		// WMF production shortener, lives on Meta wiki
		'wmf': SERVICE_PROVIDER_FACTORIES.urlshortener( { host: 'meta.wikimedia.org' } ),
		// Do not use this one in production! This is for testing only!
		'wikibase': SERVICE_PROVIDER_FACTORIES.urlshortener( { host: 'en.wikipedia.beta.wmflabs.org' } )
	};

	/**
	 * URL shortener service abstraction.
	 *
	 * @class wikibase.queryService.api.UrlShortener
	 * @license GNU GPL v2+
	 *
	 * @author Stanislav Malyshev
	 * @constructor
	 *
	 * @param {string|object} serviceConfig A configuration object like
	 * { "type": "urlshortener", "host": "meta.wikimedia.org" } or
	 * { "type": "urlshortener", "apiUrl": "https://meta.wikimedia.org/w/api.php" } or
	 * { "type": "urlshortener", "host": "wiki.example", "anonymous": false } or
	 * { "type": "tinyurl" },
	 * or, for backwards compatibility, one of the three strings "wmf", "tinyurl" or "wikibase".
	 */
	function SELF( serviceConfig ) {
		if ( serviceConfig.type in SERVICE_PROVIDER_FACTORIES ) {
			this._service = SERVICE_PROVIDER_FACTORIES[ serviceConfig.type ]( serviceConfig );
		} else if ( typeof serviceConfig === 'string' ) {
			this._service = LEGACY_SERVICE_PROVIDERS[serviceConfig] || this._badService;
		} else {
			this._service = this._badService;
		}
	}

	/**
	 * Escape text to be used as HTML content (not safe for attributes).
	 *
	 * @private
	 * @param {string} text
	 * @return {string} HTML
	 */
	function htmlEscape( text ) {
		return text.replace( /[<&]/g, function ( char ) {
			if ( char === '<' ) {
				return '&lt;';
			} else if ( char === '&' ) {
				return '&amp;';
			}
		} );
	}

	/**
	 * Service provider chosen by config.
	 * @type {function}
	 * @private
	 */
	SELF.prototype._service = null;

	/**
	 * Shorten given URL.
	 *
	 * @param {string} url URL to be shortened
	 * @return {string} HTML to display.
	 */
	SELF.prototype.shorten = function ( url ) {
		// FIXME: due to the way popover works, this gets called twice
		// we may want to consider short-term caching maybe, or some kind of debouncing?
		var urlDiv = 'url-shortener-id-' + $.now();
		$.when( this._service( url ) ).then( function ( resolved ) {
			$( '#' + urlDiv ).html( resolved );
		} );
		return '<div class="shortUrl" id="' + urlDiv + '">' +
			wikibase.queryService.ui.i18n.getMessage( 'wdqs-app-urlshortener-loading' ) + '</div>';
	};

	SELF.prototype._badService = function ( url ) {
		return wikibase.queryService.ui.i18n.getMessage( 'wdqs-app-urlshortener-bad-service' );
	};

	/** @return {string} HTML */
	SELF.prototype._getTinyUrl = function ( url ) {
		var TINYURL_API = '//tinyurl.com/api-create.php?url=';

		return '<iframe ' +
			'class="shortUrl" ' +
			'src="' + TINYURL_API + encodeURIComponent( url ) + '" ' +
			'referrerpolicy="origin" ' +
			'sandbox="" ' +
			'></iframe>';
	};

	/**
	 * @private
	 * @param {string} url
	 * @param {string} apiUrl
	 * @param {boolean} anonymous
	 * @return {jQuery.Promise}
	 */
	SELF.prototype._getWikiShort = function ( url, apiUrl, anonymous ) {
		const deferred = $.Deferred();
		$.ajax( {
			'url': apiUrl,
			'data': {
				'action': 'shortenurl',
				'format': 'json',
				'origin': anonymous ? '*' : undefined,
				'url': url
			},
			'dataType': 'json',
			'method': 'POST'
		} ).done( function ( data ) {
			var text, html, $element;
			if ( data && !data.error && data.shortenurl && data.shortenurl.shorturl ) {
				text = data.shortenurl.shorturl;
			} else {
				text = wikibase.queryService.ui.i18n.getMessage( 'wdqs-app-urlshortener-failed' );
			}
			html = '<!DOCTYPE html><meta charset="utf-8"><pre>' + htmlEscape( text ) + '</pre>';
			$element = $( '<iframe>' ).attr( {
				'class': 'shortUrl',
				'src': 'data:text/html;charset=utf-8,' + encodeURI( html ),
				'sandbox': ''
			} );
			deferred.resolve( $element );
		} ).fail( function () {
			deferred.resolve( wikibase.queryService.ui.i18n.getMessage( 'wdqs-app-urlshortener-failed' ) );
		} );
		return deferred;
	};

	return SELF;

}( jQuery ) );
