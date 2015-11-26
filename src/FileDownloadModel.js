angular.module('downgularJS')


/**
 * A service that return FileDownload objects
 */
.factory('FileDownload', function () {

	/**
	 * Represents a file to download
	 * @constructor
	 * @param {object} info - A dictionary with info associated with the file
	 * @param {string} url - URL from which the file must be downloaded
	 * @param {string} fileUrl - internal URL where the file is stored
	 */
	function FileDownload(info, url, fileUrl) {
        this.info = info;
        this.url = url;
        this.fileUrl = fileUrl;
        this.isDownloading = false;
        this.retryTimes = 0;
	}

	
	/**
	 * Public static method that create new FileDownload objects from data
	 */
	FileDownload.build = function(data) {
		if(!data)
            return null;

		return new FileDownload(data.info, data.url, data.fileUrl);
	};

    
    
    /**
	 * Public method to return object as JSON
	 */
 
    FileDownload.prototype.toJson = function(){
    	return angular.toJson(this);
    };
    
    
    /**
	 * Public static method to build FileDownload objects from an array of data
	 */
    FileDownload.localStorageRetrieverTransformer = function(data){
    	if(angular.isArray(data)){
    		return data.map(FileDownload.build).filter(Boolean);
    	}
    	return FileDownload.build(data);
    };


  
    return FileDownload;
    
});

