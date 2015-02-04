OfflSync.Remote = (function(){

	var _que = [];
	var _connections = 0;

	var callbacks = {

		onLoad: function(xhr, callbackSuccess, callbackError, event){

			_requestDone();

			if(xhr.readyState === 4) {
		        if(xhr.status === 200) {
		          callbackSuccess(xhr.response);
		        } else {
		          callbackError(event);
		        }
	      	}
		},

		onError: function(url, type, callbackError, event){
			
			_requestDone();

			OfflSync.Logger.log('OfflSync.Remote.load', 'Failed to load remote resource', event, {url: url, type: type});

			if(!callbackError) return;

			callbackError(event);
		}

	};

	function _requestDone(){

		_connections--;

		if(_que.length > 0) _load();
	}

	function _request(url, type, callbackSuccess, callbackFail){

		var xhr = new XMLHttpRequest();

	      xhr.onerror = callbacks.onError.bind(this, url, type, callbackFail);
	      xhr.onload = callbacks.onLoad.bind(this, xhr, callbackSuccess, callbackFail);
	      xhr.open('GET', url, true);
	      xhr.responseType = type;
	      xhr.send();

	}

	function _load(){

		if(_connections < OfflSync.Settings.maxRemoteConnections && _que.length > 0){

			_connections++;
			var req = _que[_que.length - 1];
			_que = _que.slice(0, _que.length - 1);
			_request(req.url, req.type, req.callbackSuccess, req.callbackFail);

		}

	}

	function load(url, type, callbackSuccess, callbackFail){

		_que.push({

			url: url,

			type: type,

			callbackSuccess: callbackSuccess,

			callbackFail: callbackFail

		});

		if(_que.length == 1) _load();

	}

	return {
		load: load
	};

})();