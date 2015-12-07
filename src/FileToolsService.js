angular.module('downgularJS')


/**
 * A provider that creates a FileTools object, with methods related with file manipulation
 * The provider has the userPersistentMemory and setStorageQuota methods, to allow configuration
 * of storage properties
 */
    .provider("FileTools", function FileToolsProvider(){

    var storageType, storageQuota;
    if(window.cordova){
        storageType = LocalFileSystem.TEMPORARY;
        storageQuota = 0;
    }
    else{
        storageType = window.TEMPORARY;
        storageQuota = 20*1024*1024;
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




    this.$get = ['$rootScope', '$q', function($rootScope, $q) {


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


        var FileTools = {};


        FileTools.getFileSystemEntry = function(){
            var deferred = $q.defer();
            var promise = deferred.promise;

            function fileSystemSuccess(fileSystem) {
                var entry=fileSystem.root; 
                window.fileSystemEntry = entry;
                deferred.resolve(window.fileSystemEntry);
            }
            function fileSystemFail(error) {
                console.log(error.message);
                deferred.reject(error);
            }


            if(window.fileSystemEntry !== undefined){
                deferred.resolve(window.fileSystemEntry);
            }
            else{
                //initialize file system and get fileSystemEntry on success.
                try{
                    if(window.cordova){
                        console.log("init persistent file system in device");
                        //if it's an app is running in the device, do normal setup
                        window.requestFileSystem(storageType, storageQuota, fileSystemSuccess, fileSystemFail);
                    }
                    else{
                        //if the app is running in browser, request storage quota and init for chrome (is the only one that provides FileSystem API)
                        console.log("init persistent file system in navigator");
                        window.resolveLocalFileSystemURI = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
                        window.requestFileSystem  = window.webkitRequestFileSystem;  
                        if(storageType === window.TEMPORARY)
                            window.requestFileSystem(storageType, storageQuota, fileSystemSuccess, fileSystemFail);
                        else{
                            navigator.webkitPersistentStorage.requestQuota(storageQuota, function(grantedBytes) {
                                window.requestFileSystem(storageType, grantedBytes, fileSystemSuccess, fail);
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
        FileTools.deleteFileFromSystemGivenURI = function(fileURI, onSuccess, onFail){
            angular.element(document).ready(function (){
                var failWithInfo = function(e){
                    var msg = fail(e);
                    if(onFail){ onFail(msg); }
                };

                try{
                    window.resolveLocalFileSystemURI(	fileURI, 
                                                     function(fileEntry){
                        var successRemoving = function(){};
                        if(onSuccess){ 
                            successRemoving = onSuccess; 
                        }
                        fileEntry.remove(successRemoving, failWithInfo);
                    },
                                                     failWithInfo
                                                    );
                }
                catch(e){
                    failWithInfo(e);
                }
            });
        };


        /**
	 * Public static method that saves a binary file to disc
	 */	
        FileTools.saveBinaryToDisc = function(arrayBuffer, name, directory, onSuccess, onFail){
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
                try{
                    window.fileSystemEntry.getDirectory(directory, {create : true, exclusive: false}, getDirectorySuccess, failWithInfo);
                }
                catch(error){
                    failWithInfo(error);
                }
            });
        };


        /**
	 * Public static method that check if a directory exists, and otherwise tries to create it
	 */
        FileTools.checkOrCreateDirectory = function(directory, onSuccess, onFail){
            if(window.fileSystemEntry === undefined){
                $rootScope.$watch(function() {
                    return window.fileSystemEntry;
                }, function watchCallback(newValue, oldValue) {
                    try{
                        window.fileSystemEntry.getDirectory(directory, {create : true, exclusive: false}, onSuccess, onFail);
                    }
                    catch(error){
                        onFail(error);
                    } 
                });
            }
            else{
                try{
                    window.fileSystemEntry.getDirectory(directory, {create : true, exclusive: false}, onSuccess, onFail);
                }
                catch(error){
                    onFail(error);
                } 
            }       
        };


        /**
	 * Public static method that gets a file in blob format from system using its URI
	 */
        FileTools.getFileFromSystemGivenURI = function(fileURI, onSuccess, onFail){
            angular.element(document).ready(function (){
                var failWithInfo = function(e){
                    var msg = fail(e);
                    if(onFail){ onFail(msg); }
                };

                try{
                    window.resolveLocalFileSystemURI(
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


        //pre-load file system entry
        FileTools.getFileSystemEntry();


        return FileTools;


    }];

});
