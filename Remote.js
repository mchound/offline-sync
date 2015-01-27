OfflSync.Remote = (function(){

	var callbacks: {

		onLoad: function(xhr, callbackSuccess, callbackError, event){

			if(xhr.readyState === 4) {
		        if(xhr.status === 200) {
		          callbackSuccess(xhr.response);
		        } else {
		          callbackError(event);
		        }
		      }		      
		},

		onError: function(callbackError, event){
			callbackError(event);
		}

	};

	function load(url, type, callbackSuccess, callbackFail){

		var xhr = new XMLHttpRequest();

	      xhr.onerror = callbacks.onError.bind(this, callbackFail);
	      xhr.onload = callbacks.onLoad.bind(this, xhr, callbackSuccess, callbackFail);
	      xhr.open('GET', url, true);
	      xhr.responseType = type;
	      xhr.send();

	}

	return {
		load: load
	};

})();