window.addEventListener('load', function(){

	OfflSync.FileList.ready(function(){

		var img = document.querySelector('[data-id]');
		var id = img.getAttribute('data-id');
		var file = OfflSync.FileList.get(id);
        img.src = file.localURL;

	});

});