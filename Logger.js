OfflSync.Logger = (function(){

	function log(location, message, error){

		console.log('Error occured in: ' + location);
		console.log('Message: ' + message);
		console.log('---------------------------- Error ----------------------------');
		console.log(error);

		if(arguments.length <= 3) return;

		console.log('---------------------------- Arguments ----------------------------');

		for(var p in arguments[3]){
			console.log(p + ' --> ' + arguments[3][p]);
		}
	}

	function msg(location, message){
		console.log('-- Message in: ' + location + ' -------------');
		console.log(message);
		console.log('');
	}

	return {
		log: log,
		msg: msg
	}

})();