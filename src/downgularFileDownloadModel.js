angular.module('downgularJS')


/**
 * A service that return downgularFileDownload objects
 */
.factory('downgularFileDownload', function () {

	/**
	 * Represents a file to download
	 * @constructor
	 * @param {object} info - A dictionary with info associated with the file
	 * @param {string} url - URL from which the file must be downloaded
	 * @param {string} fileUrl - internal URL where the file is stored
	 */
	function downgularFileDownload(info, url, fileUrl) {
        this.info = info;
        this.url = url;
        this.fileUrl = fileUrl;
        this.isDownloading = false;
        this.retryTimes = 0;
	}

	
	/**
	 * Public static method that create new downgularFileDownload objects from data
	 */
	downgularFileDownload.build = function(data) {
		if(!data)
            return null;

		return new downgularFileDownload(data.info, data.url, data.fileUrl);
	};

    
    
    /**
	 * Public method to return object as JSON
	 */
 
    downgularFileDownload.prototype.toJson = function(){
    	return angular.toJson(this);
    };
    
    
    /**
	 * Public static method to build downgularFileDownload objects from an array of data
	 */
    downgularFileDownload.localStorageRetrieverTransformer = function(data){
    	if(angular.isArray(data)){
    		return data.map(downgularFileDownload.build).filter(Boolean);
    	}
    	return downgularFileDownload.build(data);
    };


  
    return downgularFileDownload;
    
});

