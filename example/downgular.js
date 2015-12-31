angular.module('downgularJS', []);
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
angular.module('downgularJS')


/**
 * A provider that creates a downgularFileTools object, with methods related with file manipulation
 * The provider has the userPersistentMemory and setStorageQuota methods, to allow configuration
 * of storage properties
 */
    .provider("downgularFileTools", function downgularFileToolsProvider(){

    var storageType, storageQuota;
    if(window.cordova){
        window.addEventListener("deviceready", function() { 
            storageType = LocalFileSystem.TEMPORARY;
            storageQuota = 0;
        });
    }
    else{
        storageType = window.TEMPORARY;
        storageQuota = 0;
    }

    this.usePersistentMemory = function(permanent){
        if(permanent === true){
            if(window.cordova){
                storageType = LocalFileSystem.PERSISTENT;
            }
            else{
                storageType = window.PERSISTENT;
            }
        }
        else{
            if(window.cordova){
                storageType = LocalFileSystem.TEMPORARY;
            }
            else{
                storageType = window.TEMPORARY;
            }
        }
    };

    this.setStorageQuota = function(quota){
        if(!angular.isNumber(quota))
            return;

        storageQuota = quota;
    };




    this.$get = ['$rootScope', '$q', '$window', function($rootScope, $q, $window) {


        /**
	 * Private method to log file error
	 */
        var fail = function(e){
            var msg = '';
            switch (e.code) {
                case FileError.QUOTA_EXCEEDED_ERR:
                    msg = 'QUOTA_EXCEEDED_ERR';
                    break;
                case FileError.NOT_FOUND_ERR:
                    msg = 'NOT_FOUND_ERR';
                    break;
                case FileError.SECURITY_ERR:
                    msg = 'SECURITY_ERR';
                    break;
                case FileError.INVALID_MODIFICATION_ERR:
                    msg = 'INVALID_MODIFICATION_ERR';
                    break;
                case FileError.INVALID_STATE_ERR:
                    msg = 'INVALID_STATE_ERR';
                    break;
                default:
                    msg = e.code  || e.message;
                    break;
            }
            console.log('Error: ' + msg);
            return msg;
        };


        var downgularFileTools = {};

        var fileSystem = null;


        downgularFileTools.getFileSystemEntry = function(){
            var deferred = $q.defer();
            var promise = deferred.promise;

            //if filesystem already exists, resolve promise
            if(fileSystem !== null){
                deferred.resolve(fileSystem);
            }
            //otherwise initialize file system and get fileSystemEntry on success.
            else{
                var fileSystemSuccess = function(fs) {
                    fileSystem=fs.root; 
                    deferred.resolve(fileSystem);
                };
                var fileSystemFail = function(error) {
                    console.log(error.message);
                    deferred.reject(error);
                };
                try{
                    if($window.cordova){
                        console.log("init persistent file system in device");
                        //if it's an app is running in the device, do normal setup
                        $window.requestFileSystem(storageType, storageQuota, fileSystemSuccess, fileSystemFail);
                    }
                    else{
                        //if the app is running in browser, request storage quota and init for chrome (is the only one that provides FileSystem API)
                        console.log("init persistent file system in navigator");
                        $window.resolveLocalFileSystemURI = $window.resolveLocalFileSystemURL || $window.webkitResolveLocalFileSystemURL;
                        $window.requestFileSystem  = $window.webkitRequestFileSystem;  
                        if(storageType === $window.TEMPORARY)
                            $window.requestFileSystem(storageType, storageQuota, fileSystemSuccess, fileSystemFail);
                        else{
                            navigator.webkitPersistentStorage.requestQuota(storageQuota, function(grantedBytes) {
                                $window.requestFileSystem(storageType, grantedBytes, fileSystemSuccess, fail);
                            }, function(e) {
                                console.log('Error', e);
                            });
                        }
                    }
                }
                catch(error){
                    deferred.reject(error);
                }             
            }

            return promise;
        };



        /**
	 * Public static method that deletes a file from system using its URI
	 */
        downgularFileTools.deleteFileFromSystemGivenURI = function(fileURI, onSuccess, onFail){
            angular.element(document).ready(function (){
                var failWithInfo = function(e){
                    var msg = fail(e);
                    if(onFail){ onFail(msg); }
                };

                try{
                    $window.resolveLocalFileSystemURI(fileURI, function(fileEntry){
                        var successRemoving = function(){};
                        if(onSuccess){ 
                            successRemoving = onSuccess; 
                        }
                        fileEntry.remove(successRemoving, failWithInfo);
                    },failWithInfo);
                }
                catch(e){
                    failWithInfo(e);
                }
            });
        };


        /**
	 * Public static method that saves a binary file to disc
	 */	
        downgularFileTools.saveBinaryToDisc = function(arrayBuffer, name, directory, onSuccess, onFail){
            /////////////////////////
            // save to disk method //
            /////////////////////////
            angular.element(document).ready(function (){
                //define variables and functions
                var filename = name;
                var fileUrl;

                var failWithInfo = function(e){
                    var msg = fail(e);
                    if(onFail){onFail(msg);}
                };

                var getFileWriterSuccess = function(writer) {
                    writer.onwrite = function(evt) {
                        if(onSuccess){ onSuccess(fileUrl); }
                    };

                    writer.onerror = function(error){
                        failWithInfo(error);
                    };

                    blob = new Blob([arrayBuffer]);
                    writer.write(blob);
                };

                var getFileSuccess = function(fileEntry) {
                    fileUrl = fileEntry.toURL();
                    fileEntry.createWriter(getFileWriterSuccess, failWithInfo);
                };

                var getDirectorySuccess = function(fileDirectory) {
                    fileDirectory.getFile(filename, {create: true, exclusive: false}, getFileSuccess, failWithInfo);
                };

                //start running the save code

                downgularFileTools.getFileSystemEntry().then(function(fileSystem){
                    try{
                        fileSystem.getDirectory(directory, {create : true, exclusive: false}, getDirectorySuccess, failWithInfo);
                    }
                    catch(error){
                        failWithInfo(error);
                    }
                }, failWithInfo);

            });
        };


        /**
	 * Public static method that check if a directory exists, and otherwise tries to create it
	 */
        downgularFileTools.checkOrCreateDirectory = function(directory, onSuccess, onFail){

            downgularFileTools.getFileSystemEntry().then(function(fileSystem){
                try{
                    fileSystem.getDirectory(directory, {create : true, exclusive: false}, onSuccess, onFail);
                }
                catch(error){
                    onFail(error);
                }
            }, onFail);
        };


        /**
	 * Public static method that gets a file in blob format from system using its URI
	 */
        downgularFileTools.getFileFromSystemGivenURI = function(fileURI, onSuccess, onFail){
            angular.element(document).ready(function (){
                var failWithInfo = function(e){
                    var msg = fail(e);
                    if(onFail){ onFail(msg); }
                };

                try{
                    $window.resolveLocalFileSystemURI(
                        fileURI,  
                        function(fileEntry){

                            var reader = new FileReader();
                            reader.onload = function (evt) {
                                console.log("read success");
                                onSuccess(new Blob([evt.target.result]));
                                /*console.log(new Uint8Array(evt.target.result));*/
                            };

                            reader.onerror = function (evt) {
                                console.log("error");
                                failWithInfo(evt);
                                /*console.log(new Uint8Array(evt.target.result));*/
                            };                    


                            fileEntry.file(
                                function(file)
                                {
                                    reader.readAsArrayBuffer(file);
                                },
                                failWithInfo
                            );

                        },
                        failWithInfo
                    );
                }
                catch(e){
                    console.log("exception thrown in getFileFromSystemGivenURI ");
                    failWithInfo(e);
                }
            });
        };



        return downgularFileTools;

    }];
});

angular.module('downgularJS')


/**
 * A service that return a downgularGenericTools object
 */
    .factory('downgularGenericTools', ['downgularFileTools', function(downgularFileTools) {

        var downgularGenericTools = {};

        downgularGenericTools.onlyCharsSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        /**
	 * Public static method that creates a random alphanumeric string
	 */
        downgularGenericTools.randomAlphaNumericString = function(length, charSet) {
            var result = [];

            length = length || 10;
            charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            charSet = charSet.split("");

            while (--length) {
                result.push(charSet[Math.floor(Math.random() * charSet.length)]);
            }

            return result.join('');
        };

        /**
	 * Public static method that returns an available filename to write in the expected directory
	 */
        downgularGenericTools.getValidFilenameInDir = function(dir, length, extension, onSuccess, onFail){

            //internal methods definition

            function fail(error) {
                console.log("Failed to reach directories: " + error.message);
                onFail(error);
            }

            function readEntriesSuccess(entries) {
                var i;
                var fileNames = [];

                //get the file names in the directory
                for (i=0; i<entries.length; i++) {
                    fileNames.push(entries[i].name);
                }

                //create a random name until it's not in the directory
                var valid = false;
                var name;
                while(!valid){
                    name = downgularGenericTools.randomAlphaNumericString(length) + extension;
                    if(!fileNames[name]){
                        valid = true;
                    }
                }

                onSuccess(name);
            }


            function getDirectorySuccess(fileDirectory) {
                // Get a directory reader
                var directoryReader = fileDirectory.createReader();

                // Get a list of all the entries in the directory
                directoryReader.readEntries(readEntriesSuccess,fail);
            }

            //code to execute
            downgularFileTools.getFileSystemEntry().then(function(fileSystem){
                //try to access dir
                try{
                    fileSystem.getDirectory(dir, {create : true}, getDirectorySuccess, fail);
                }
                catch(error){
                    fail(error);
                }
            }, fail);

        };



        return downgularGenericTools;

    }]);

angular.module('downgularJS')


/**
 * A service that return downgularFileDownload objects
 */
.factory('downgularMIMEType', function () {

var types = {
    'text/html':                             'html',
    'text/css':                              'css',
    'text/xml':                              'xml',
    'image/gif':                             'gif',
    'image/jpeg':                            'jpg',
    'application/x-javascript':              'js',
    'application/atom+xml':                  'atom',
    'application/rss+xml':                   'rss',
    'text/mathml':                           'mml',
    'text/plain':                            'txt',
    'text/vnd.sun.j2me.app-descriptor':      'jad',
    'text/vnd.wap.wml':                      'wml',
    'text/x-component':                      'htc',
    'image/png':                             'png',
    'image/tiff':                            'tiff',
    'image/vnd.wap.wbmp':                    'wbmp',
    'image/x-icon':                          'ico',
    'image/x-jng':                           'jng',
    'image/x-ms-bmp':                        'bmp',
    'image/svg+xml':                         'svg',
    'image/webp':                            'webp',
    'application/java-archive':              'jar',
    'application/mac-binhex40':              'hqx',
    'application/msword':                    'doc',
    'application/pdf':                       'pdf',
    'application/postscript':                'ps',
    'application/rtf':                       'rtf',
    'application/vnd.ms-excel':              'xls',
    'application/vnd.ms-powerpoint':         'ppt',
    'application/vnd.wap.wmlc':              'wmlc',
    'application/vnd.google-earth.kml+xml':  'kml',
    'application/vnd.google-earth.kmz':      'kmz',
    'application/x-7z-compressed':           '7z',
    'application/x-cocoa':                   'cco',
    'application/x-java-archive-diff':       'jardiff',
    'application/x-java-jnlp-file':          'jnlp',
    'application/x-makeself':                'run',
    'application/x-perl':                    'pl',
    'application/x-pilot':                   'prc',
    'application/x-rar-compressed':          'rar',
    'application/x-redhat-package-manager':  'rpm',
    'application/x-sea':                     'sea',
    'application/x-shockwave-flash':         'swf',
    'application/x-stuffit':                 'sit',
    'application/x-tcl':                     'tcl',
    'application/x-x509-ca-cert':            'der',
    'application/x-xpinstall':               'xpi',
    'application/xhtml+xml':                 'xhtml',
    'application/zip':                       'zip',
    'application/octet-stream':              'bin',
    'audio/midi':                            'mid',
    'audio/mpeg':                            'mp3',
    'audio/ogg':                             'ogg',
    'audio/x-realaudio':                     'ra',
    'video/3gpp':                            '3gp',
    'video/mpeg':                            'mpg',
    'video/quicktime':                       'mov',
    'video/x-flv':                           'flv',
    'video/x-mng':                           'mng',
    'video/x-ms-asf':                        'asf',
    'video/x-ms-wmv':                        'wmv',
    'video/x-msvideo':                       'avi',
    'video/mp4':                             'mp4'
	};

	var downgularMIMETypes = {};

	downgularMIMETypes.getExtensionFromType = function(type){
		var extension = types[type];
		if(extension === undefined)
			return "";
		else
			return "."+extension;
	};

	downgularMIMETypes.getTypeFromExtension = function(ext){
		for(var key in types){
			if(types[key] === ext)
				return key;
		}
		return "unknown";
	};

	return downgularMIMETypes;

 });