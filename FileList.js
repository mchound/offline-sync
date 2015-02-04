OfflSync.FileList = (function(){


	var _remoteFileList = null;
	var _fileMapping = {};
	var _filesMapped = 0;
	var _readyCallbacks = [];
	var _ready = false;

	function _fetchFileList(){

		OfflSync.Remote.load(

			// URL to remote file list
			OfflSync.Settings.remoteFileListURL, 

			// We want the file list in json
			'application/json', 

			// Success callback
			function(/* string */ fileList){
				_remoteFileList = JSON.parse(fileList);
				OfflSync.Logger.msg('OfflSync.FileList._fetchFileList', 'Remote file list fetched');
				OfflSync.Dispatcher.dispatch({type: OfflSync.Constants.ActionTypes.FILE_LIST_FETCH});
			},	

			// Error callback. Not much we can do, the error is logged in OfflSync.Remote
			function(error){
				
			}
		);

	}

	function _mapFiles(){

		_filesMapped = 0;

		for(var i = 0; i < _remoteFileList.length; i++){
			_mapFile(_remoteFileList[i]);
		}

	}

	function _mapFile(file){

		OfflSync.Remote.load(

			// URL to file
			file.remoteUrl, 

			// Repsonse type
			'blob',

			// Success callback
			function(blob){

				_fileMapping[file.id] = {
					remoteURL: file.remoteUrl,
					localURL: null
				};

				OfflSync.Dispatcher.dispatch({
					type: 		OfflSync.Constants.ActionTypes.FILE_FETCH, 
					fileType: 	OfflSync.Constants.FileTypes.BLOB, 
					content: 	blob, 
					file: file
				});
			},

			// Error, not much we can do. Error is logged in OfflSync.Remote
			function(error){

			}

		);

	}

	// Registered to the dispatcher. This should act when a remote file is stored locally.
	function _mapStoredFile(payload){

		if(payload.type !== OfflSync.Constants.ActionTypes.FILE_LOCAL_STORE) return;

		_filesMapped++;

		_fileMapping[payload.file.id].localURL = payload.url;

		if(_filesMapped === Object.keys(_fileMapping).length){
			_storeMappingLocally();
		} 

	}

	// Called when all remote files are stored locally
	function _storeMappingLocally(){

		OfflSync.FileSystem.saveFile(

			// Filename of the file mapping file
			OfflSync.Settings.mappingFileName, 

			// Create a blob from the file mapping as a string
			new Blob([JSON.stringify(_fileMapping)]),

			// Success callback
			function(){
				OfflSync.Dispatcher.dispatch({ type: OfflSync.Constants.ActionTypes.FILES_MAPPED });
				OfflSync.Logger.msg('OfflSync.FileList._storeMappingLocally', 'All remote files are stored locally and the file mapping i stored locally');
			},

			// Error callback, not much we can do. Error is logged in OfflSync.FileSystem._writeToFile
			function(error){

			}

		);

	}

	// Init, load locally stored file list
	function _init(){

		OfflSync.FileSystem.getFile(

			// Filename of the file mapping file
			OfflSync.Settings.mappingFileName,

			// Success callback
			function(/* string */ content){
				_fileMapping = JSON.parse(content);
				OfflSync.Dispatcher.dispatch({ type: OfflSync.Constants.ActionTypes.FILE_LIST_READY });
				_ready = true;
				_onReady();
			},

			// Error callback
			function(error){
				OfflSync.Dispatcher.dispatch({ type: OfflSync.Constants.ActionTypes.FILE_LIST_READY });	
				_ready = true;
				_onReady();
			}

		);

	}

	function _onReady(){

		for(var i = 0; i < _readyCallbacks.length; i++){
			_readyCallbacks[i].call(_fileList);
		}

	}

	function sync(){}

	function reload(){

		OfflSync.Dispatcher.waitFor(

			// Wait for: reset of file system and fetch remote file list
			[OfflSync.Constants.ActionTypes.FILE_SYSTEM_RESET, OfflSync.Constants.ActionTypes.FILE_LIST_FETCH],

			// Callback
			function(payload){
				_mapFiles();
			}

		);

		OfflSync.FileSystem.reset();
		_fetchFileList();
		_fileMapping = {};

	}

	function ready(callback){
		_readyCallbacks.push(callback);

		if(_ready) callback.call(_fileList);

	}

	function get(id){

		return _fileMapping[id];

	}

	OfflSync.Dispatcher.register(_mapStoredFile);

	_init();

	var _fileList = {
		sync: sync,
		reload: reload,
		ready: ready,
		get: get
	}

	return _fileList;

})();