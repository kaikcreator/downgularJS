angular.module('downgularJS')


/**
 * Constant with download status
 */
.constant('downgularJSQueueStatus', {
    'STOPPED': 0,
    'STARTED': 1,
    'RUNNING': 2
})

.constant('downgularJSError', {
    'storage': 'Error while storing file',
    'download': 'Error downloading file',
    'unknownExtension': 'Error: unknown extension file',
})

/**
 * A service that handles an array of downgularFileDownload objects
 */
.factory('downgularQueue', ['$http', '$q', 'downgularFileDownload', 'downgularGenericTools', 'downgularFileTools', 
    'downgularMIMEType', 'downgularJSQueueStatus', 'downgularJSError',
    function($http, $q, downgularFileDownload, downgularGenericTools, downgularFileTools, downgularMIMEType, 
        downgularJSQueueStatus, downgularJSError) {

    /**
     * Represents a queue of file to download
     * @constructor
     * @param {string} queueName - The name of the queue
     * @param {string} directory - The path to the directory where files will be stored
     * @param {function} onSuccess - Callback to call when file is downloaded and stored
     * @param {function} onError - Callback to call when file cannot be downloaded or stored
     */    
    function downgularQueue(queueName, directory, onSuccess, onError) {
        this.queueName = queueName;
        this.directory = directory;
        this.onSuccess = onSuccess;
        this.onError = onError;
        this.downloadsArray = [];
        this.setStopStatus();
    }
    /** method to set stop status, you probably won't use this method directly */
    downgularQueue.prototype.setStopStatus = function(){
        this.state = downgularJSQueueStatus.STOPPED;
    };
    
    /** method to set start status, you probably won't use this method directly */
    downgularQueue.prototype.setStartStatus = function(){
        this.state = downgularJSQueueStatus.STARTED;
    };
    
    /** method to set run status, you probably won't use this method directly */
    downgularQueue.prototype.setRunStatus = function(){
        this.state = downgularJSQueueStatus.RUNNING;
    };
    
    /** method to check if status is stopped, you probably won't use this method directly */
    downgularQueue.prototype.isStopped = function(){
        return this.state == downgularJSQueueStatus.STOPPED ? true : false;
    };
    
    /** method to check if status is started, you probably won't use this method directly */
    downgularQueue.prototype.isStarted = function(){
        return this.state == downgularJSQueueStatus.STARTED ? true : false;
    };

    /** method to check if status is running, you probably won't use this method directly */
    downgularQueue.prototype.isRunning = function(){
        return this.state == downgularJSQueueStatus.RUNNING ? true : false;
    };   
    
    /** method that will be called when file is stored succesfully, you probably won't use this method directly */
    downgularQueue.prototype.storeSuccesful = function(fileUrl){
        //on success remove first element and download next
        console.log("[" + this.queueName + " queue]: file stored successfully at: " + fileUrl);
        
        //save the fileUrl of the downloaded file
        this.downloadsArray[0].fileUrl = fileUrl;
        
        //call download success callback
        if(this.onSuccess)
            this.onSuccess(this.downloadsArray[0]);
        
        //remove alredy downloaded element (position 0) from downloads array
        this.downloadsArray.shift();
        if(this.downloadsArray.length > 0){
            this.downloadNext();
        }
        else{
            //there are no more files to download, set state to STARTED but not RUNNING
            this.setStartStatus();
        }
    };
    
    /** method that will be called in case a file cannot be succesfully stored, you probably won't use this method directly */
    downgularQueue.prototype.errorStoring = function(err){
        //if there's an issue storing files, run an error and do not download any more file
        if(this.onError)
            this.onError({'msg':downgularJSError.storage});
        //save pending downloads in persistent memory
        this.saveFileDownloads();
        this.setStartStatus();
    };
    
    /** method to store a blob object as a file in the queue directory, you probably won't use this method directly */
    downgularQueue.prototype.storeFile = function(blobFile){
        
        //Get a valid filename, and on success, save file to disc
        var extension = downgularMIMEType.getExtensionFromType(blobFile.type);

        if(!extension){
            //an error has been produced with the downloaded data, unknown extension
            if(this.onError)
                this.onError({'msg':downgularJSError.unknownExtension});
            this.retryDownload();
            return;
        }
        
        var onValidName = function(name){
            //if name is valid, save file to disc
            downgularFileTools.saveBinaryToDisc(blobFile, name, this.directory, this.storeSuccesful.bind(this), this.errorStoring.bind(this));
        };
        
        var onNameError = function(error){
            console.log("error getting file filename: " + error);
            //create an emergency name
            var name = Date.now().toString() + extension;
            downgularFileTools.saveBinaryToDisc(blobFile, name, this.directory, this.storeSuccesful.bind(this), this.errorStoring.bind(this));
        };
        
        //try to get a valid filename in the current directory
        downgularGenericTools.getValidFilenameInDir(this.directory, 12, extension, onValidName.bind(this), onNameError.bind(this));
    };
 
    /** method to retry download, you probably won't use this method directly */   
    downgularQueue.prototype.retryDownload = function(e){
        
        this.downloadsArray[0].isDownloading = false;

        //if file has been tryed to download less than 2 times, try it again
        if(this.downloadsArray[0].retryTimes < 2){
            this.downloadsArray[0].retryTimes++;
            this.downloadNext();
        }
        //otherwise, pass downloadFile to user with error msg, and download next if any
        else{
            if(this.onError)
                this.onError({'msg':downgularJSError.download, 'downloadFile':this.downloadsArray[0]});

            //remove alredy downloaded element (position 0) from downloads array
            this.downloadsArray.shift();
            if(this.downloadsArray.length > 0){
                this.downloadNext();
            }
            else{
                //there are no more files to download, set state to STARTED but not RUNNING
                this.setStartStatus();
            }
        }
    };

    /** method to download next file, you probably won't use this method directly */
    downgularQueue.prototype.downloadNext = function(){
        if(this.isStopped())
            return;
        
        console.log("GOING TO DOWNLOAD: " + angular.toJson(this.downloadsArray[0]));
        this.downloadsArray[0].isDownloading = true;
        $http.get(this.downloadsArray[0].url, {
            method: 'GET',
            responseType: 'blob', //this way, the object I receive will be a binary blob, that can be directly stored in the file system
        })
        .success(this.storeFile.bind(this))
        .error(this.retryDownload.bind(this));

    };  


    // next, methods that are intended to be used by user //

    /** Public method to add a file to the download queue */
    downgularQueue.prototype.addFileDownload = function(info, url, fileUrl){
        if(url !== null && url !== "")
            this.downloadsArray.push(downgularFileDownload.build({info:info, url:url, fileUrl:fileUrl}));
        
        //check if queue is started but not running, in which case, schedule next file to donwload
        if(this.isStarted()){
            this.downloadNext();
            this.setRunStatus();            
        }
    };

    /** Public method to add a file at the begining of the download queue */
    downgularQueue.prototype.addPriorityFileDownload = function(info, url, fileUrl){
        if(url !== null && url !== "")
            //set the file in the position 1 of the array (in case size = 0, splice puts it at pos 0)
            this.downloadsArray.splice(1, 0, downgularFileDownload.build({info:info, url:url, fileUrl:fileUrl}));
        
        //check if queue is started but not running, in which case, schedule next file to donwload
        if(this.isStarted()){
            this.downloadNext();
            this.setRunStatus();            
        }
    }; 

    /** Public method to remove a fileDownload from the download queue, in case it's download did not start */
    downgularQueue.prototype.removeFileDownload = function(url){
        if(url !== null && url !== ""){
            var length = this.downloadsArray.length;
            for(var i=0; i< length; i++){
                if(this.downloadsArray[i].url === url && !this.downloadsArray[i].isDownloading){
                    //in case downloadFile is found and it's not being currently downloaded, remove it
                    this.downloadsArray.splice(i, 1);
                }
            }
        }
    };        
   
    /**
     * Public method to save download queue in local storage
     */
    downgularQueue.prototype.saveFileDownloads = function(){
        window.localStorage[this.queueName + 'Queue'] = angular.toJson(this.downloadsArray);
    }; 

    /**
     * Public method to retrieve download queue from local storage
     */
    downgularQueue.prototype.loadFileDownloads = function(){
        this.downloadsArray = window.localStorage[this.queueName + 'Queue'];
        if(this.downloadsArray){
            this.downloadsArray = angular.fromJson(this.downloadsArray);
            this.downloadsArray = downgularFileDownload.localStorageRetrieverTransformer(this.downloadsArray); 
        }
        else
            this.downloadsArray = [];

    };   

    /**
     * Public method to start downloads
     */
    downgularQueue.prototype.startDownloading = function(){
        if(this.downloadsArray.length > 0){
            this.setRunStatus();
            this.downloadNext();
        }
        else{
            this.setStartStatus();
        }
    };

    /**
     * Public method to stop downloads
     */
    downgularQueue.prototype.stopDownloading = function(){
        this.setStopStatus();
    };


	/**
	 * Public static method that creates a new file download queue
	 */
	downgularQueue.build = function(name, directory, onSuccess) {
        //try to create directory if it does not exists
        downgularFileTools.checkOrCreateDirectory(directory, null, function(err){
            console.log("Error creating directory " + directory + ", error: " + err);
        });
		return new downgularQueue(name, directory, onSuccess);
	};

			

	return downgularQueue;
}]);