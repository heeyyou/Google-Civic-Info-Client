var request = require('request');
var pattern = require('urlpattern').express;

var _endpoints = {
	"elections" : {
		"method" : "GET",
		"path" : "elections"
	},

	"voterinfo" : {
		"method" : "POST",
		"path" : "voterinfo/:electionId/lookup"
	},

	"representatives" : {
		"method" : "POST",
		"path" : "representatives/lookup"
	},

	"divisions" : {
		"method" : "GET",
		"path" : "representatives/division_search"
	},
};

var _requests = {};
_requests['GET'] = function(url, options, callback) {
	request.get(url,
					{qs: options},
					function(e, r, body) {
						if (e) {
							callback(e);
						}
						else {
							callback(null, JSON.parse(body));
						}
					}
				);
};

_requests['POST'] = function(url, options, callback, content) {
	request.post(url,
					{
						qs: options,
						json : content
					},
					function(e, r, json) {
						if (e) {
							callback(e);
						}
						else {
							callback(null, json);
						}
					}
				);
};

function CivicInfo(options) {
	var defaultOptions = {
	};
	this._options = options || defaultOptions;
	
	// utility method to override options
	function override(o1, o2) {
		for (var k in o1) {
			if (!o2.hasOwnProperty(k)) {
				o2[k] = o1[k];
			}
		}
		return o2;
	}

	var self = this;



	function query(method, path, content, options, callback) {
		var url = 'https://www.googleapis.com/civicinfo/v1/' +
							path;
		_requests[method](url, options, callback, content, callback);
	}

	function defineEndpoint(e, endPoint) {
		self[e] = function(opts, callback) {
			var args = arguments;

			// If path had place holders, arguments contain values
			var placeholders = [];
			var regexp = pattern.parse(endPoint.path, placeholders);
			var values = {};
			placeholders.forEach(function(ph) {
				values[ph.name] = [].shift.call(args);
			});
			var path = pattern.transform(endPoint.path, values);

			var content = null;
			if (endPoint.method === 'POST') {
				content = [].shift.call(args);
			}

			// options provided?
			if (arguments.length == 1) {
				callback = opts;
				opts = {};
			}

			opts = override(self._options, opts);

			query(endPoint.method, path, content, opts, callback);
			
		};

	}

	// Create methods for supported endpoints
	for (var e in _endpoints) {
		defineEndpoint(e, _endpoints[e]);
	}

}


module.exports = CivicInfo;
module.exports.version = '0.1.1';
