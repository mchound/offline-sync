OfflSync.Dispatcher = (function(){

	var _callbacks = {};
	var _waitCallbacks = {}
	var _waitDispatchTypes = {};
	var _lastId = 1;
	var _prefix = 'ID_'
	var _waitLastId = 1;
	var _waitPrefix = 'WAIT_ID_';

	function register(callback){
		var id = _prefix + _lastId++;
		_callbacks[id] = callback;
	}

	function unregister(id){
		delete _callbacks[id];
	}

	function dispatch(payload){

		for(var id in _callbacks){
			_callbacks[id](payload);

			if(!!_waitDispatchTypes[payload.type]){

				for(var i = 0; i < _waitDispatchTypes[payload.type].length; i++){
					var waitID = _waitDispatchTypes[payload.type][i];
					delete _waitCallbacks[waitID].types[payload.type];

					if(Object.keys(_waitCallbacks[waitID].types).length === 0){
						var cb = _waitCallbacks[waitID].callback;
						delete _waitCallbacks[waitID];
						cb();
					}
				}

				delete _waitDispatchTypes[payload.type];

			}
		}

	}

	function waitFor(dispatchTypes, callback){

		var id = _waitPrefix + _waitLastId++;
		_waitCallbacks[id] = {
			callback: callback,
			types: {}
		};

		for(var i = 0; i < dispatchTypes.length; i++){

			_waitCallbacks[id].types[dispatchTypes[i]] = true;

			if(!_waitDispatchTypes[dispatchTypes[i]]){
				_waitDispatchTypes[dispatchTypes[i]] = [];
			}

			_waitDispatchTypes[dispatchTypes[i]].push(id);

		}
	}

	function monitor(){

		console.log('----------------------------- Registered callbacks ------------------');
		console.log('Used: '  + Object.keys(_callbacks).length + '. Consumed: ' + (_lastId - Object.keys(_callbacks).length));
		console.log(_callbacks);
		console.log('----------------------------- Registered Wait callbacks ------------------');
		console.log('Used: '  + Object.keys(_waitCallbacks).length + '. Consumed: ' + (_waitLastId - Object.keys(_waitCallbacks).length));
		console.log(_waitCallbacks);
		console.log('----------------------------- Registered Dispatch types ------------------');
		console.log(_waitDispatchTypes);

	}

	return {
		register: register,
		unregister: unregister,
		dispatch: dispatch,
		waitFor: waitFor,
		monitor: monitor
	}

})();