OfflSync.FileSystem = (function(){
	
	var _fs = null;
	var _root = null;
	var _que = [];

	function _init(){

		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

		window.requestFileSystem(
	        window.TEMPORARY,
	        OfflSync.Settings.storageSize * 1024 * 1024,
	        function(fs){

	        	_fs = fs;
	        	_createRoot();

	        },
	        function(error){
	        	OfflSync.Logger.log('OfflSync.FileSystem.init', "Error trying to request filesystem", error);
	        }
        );

	}

	function _createRoot(){

		_fs.root.getDirectory(
			// Root directory name
			OfflSync.Settings.fileSystemRoot, 

			// Create
			{create: true},

			// Success callback
			function(dirEntry){
				_root = dirEntry;
				OfflSync.Logger.msg('OfflSync.FileSystem._createRoot', 'Filesystem recieved and root directory created');
				OfflSync.Dispatcher.dispatch({type: OfflSync.Constants.ActionTypes.FILE_SYSTEM_INIT});
			},

			// Error callback
			function(error){
				OfflSync.Logger('OfflSync.FileSystem.createRoot', "Error trying create root directory", error);
			}

		);

	}

	function _removeDirectory(dirEntry, successCallback, errorCallback){

		dirEntry.removeRecursively(

			// Success callback
			function() {
      			successCallback()
    		}, 

    		// Error callback
    		function(error){
    			errorCallback(error);
    			OfflSync.Logger('OfflSync.FileSystem._removeDirectory', "Error trying to delete directory", error, {entry: dirEntry});
    		}

		);

	}

	function _executeQue(payload){

		if(payload.type !== OfflSync.Constants.ActionTypes.FILE_SYSTEM_INIT) return;

		for(var i = 0; i < _que.length; i++){
			_que[i].func.apply(this, _que[i].args);
		}

		_que = [];

	}

	function _saveRemoteFile(payload){

		if(payload.type !== OfflSync.Constants.ActionTypes.FILE_FETCH) return;

		if(payload.fileType === OfflSync.Constants.FileTypes.BLOB) _saveBlobFile(payload.file, payload.content)

	}

	function _saveBlobFile(file, blob){

		if(!_fs){
			_que.push({func: _saveBlobFile, args: arguments});
			return;	
		}

		_openOrCreate(

			// File name
			'/' + file.id,

			// Create is set to true, if the file exist an error will be thrown in _openOrCreate and an new attemp is made but with create = false
			true,

			// Success callback
			function(fileEntry){
				_writeToFile(

					// The file content
					blob, 

					// The file entry
					fileEntry,

					// Success callback
					function(){
						OfflSync.Dispatcher.dispatch({type: OfflSync.Constants.ActionTypes.FILE_LOCAL_STORE, file: file, url: fileEntry.toURL()});
					},

					// Error callback, not much we can do, the error is logged in _writeToFile
					function(error){

					}
				);
			},

			// Error, not much we can do. Error is logged in _openOrCreate
			function(error){

			}

		);

	}

	function _writeToFile(content, fileEntry, successCallback, errorCallback){

		fileEntry.createWriter(

			// Write content to file
			function(writer){

				writer.onwriteend = function(e){
					successCallback()					
				}

				writer.onerror = function(error){
					OfflSync.Logger.log('OfflSync.FileSystem._writeToFile', "Error trying to write to file", error, {file: file, content: content, fileEntry: fileEntry});
					errorCallback(error);
				}

				writer.write(content);

			},

			function(error){
				OfflSync.Logger.log('OfflSync.FileSystem._writeToFile', "Error trying to get file writer", error, {file: file, content: content, fileEntry: fileEntry});
			}

		);
	}

	function _openOrCreate(path, create, successCallback, errorCallback){

		_root.getFile(

			path,

			create ? {create: true, exclusive: true} : {},

			function(fileEntry){
				successCallback(fileEntry);
			},

			function(error){

				if(OfflSync.Constants.FileErrors.InvalidModificationError !== error.msg){
					OfflSync.Logger.log('OfflSync.FileSystem._openOrCreae', "Error trying to get file entry", error, {path: path, create: create});
					errorCallback(error);
					return;
				}

				_openOrCreate(path, false, successCallback, errorCallback);
				
			}

		);

	}

	function getFile(name, successCallback, errorCallback){

		if(!_fs){
			_que.push({func: getFile, args: arguments});
			return;	
		}		

		_root.getFile(

			// Filename
			'/' + name,

			{create: false},

			// Success callback
			function(fileEntry){

				fileEntry.file(

					// success callback
					function(file){

						var reader = new FileReader();

						reader.onerror = function(error){
							OfflSync.Logger.log('OfflSync.FileSystem.getFile', "Error trying to read file", error, {name: name});
							errorCallback(error);
						}

						reader.onloadend = function(e){
							successCallback(this.result);
						}

						reader.readAsText(file);

					},

					// Error callback
					function(error){
						OfflSync.Logger.log('OfflSync.FileSystem.getFile', "Error trying to get file reader", error, {name: name});
						errorCallback(error);
					}
				);

			},

			// Error callback
			function(error){
				OfflSync.Logger.log('OfflSync.FileSystem.getFile', "Error trying to get file entry", error, {name: name});
				errorCallback(error);
			}

		);

	}

	function saveFile(name, content, successCallback, errorCallback){

		_openOrCreate(

			// File name
			'/' + name,

			// Create is set to true, if the file exist an error will be thrown in _openOrCreate and an new attemp is made but with create = false
			true,

			// Success callback
			function(fileEntry){
				_writeToFile(

					// The file content
					content, 

					// The file entry
					fileEntry,

					// Success callback
					function(){
						successCallback();
					},

					// Error callback, not much we can do, the error is logged in _writeToFile
					function(error){
						errorCallback(error);
					}
				);
			},

			// Error, not much we can do. Error is logged in _openOrCreate
			function(error){

			}

		);

	}

	function reset(){

		if(!_fs){
			_que.push({func: reset, args: arguments});
			return;	
		}

		_fs.root.getDirectory(
			
			// Root Directory name
			OfflSync.Settings.fileSystemRoot,

			//
			{},

			// Success callback
			function(dirEntry){

				_removeDirectory(

					// Directory entry
					dirEntry,

					// Success callback
					function(){
						OfflSync.Dispatcher.dispatch({type: OfflSync.Constants.ActionTypes.FILE_SYSTEM_RESET});
					},

					// Error callback
					function(error){

					}
				);

			},

			// Error callback
			function(error){
				OfflSync.Logger('OfflSync.FileSystem._reset', "Error trying to get root directory", error);
			}

		);

	}

	OfflSync.Dispatcher.register(_executeQue);
	OfflSync.Dispatcher.register(_saveRemoteFile);

	_init();

	return {
		isReady: function() { return !!_fs },
		reset: reset,
		getFile: getFile,
		saveFile: saveFile
	}

})();