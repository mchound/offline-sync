OfflSync.FileList = function(){};

OfflSync.FileList.prototype = {

	remoteFileList: null,

	callbacks: {
		
	}

	sync: function(){

		OfflSync.Remote.load(OfflSync.Settings.remoteFileListURL, 'application/json', )

	}

}