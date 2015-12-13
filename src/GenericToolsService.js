angular.module('downgularJS')


/**
 * A service that return a GenericTools object
 */
    .factory('GenericTools', ['FileTools', function(FileTools) {

        var GenericTools = {};

        GenericTools.onlyCharsSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        /**
	 * Public static method that creates a random alphanumeric string
	 */
        GenericTools.randomAlphaNumericString = function(length, charSet) {
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
        GenericTools.getValidFilenameInDir = function(dir, length, extension, onSuccess, onFail){

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
                    name = GenericTools.randomAlphaNumericString(length) + extension;
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
            FileTools.getFileSystemEntry().then(function(fileSystem){
                //try to access dir
                try{
                    fileSystem.getDirectory(dir, {create : true}, getDirectorySuccess, fail);
                }
                catch(error){
                    fail(error);
                }
            }, fail);

        };



        return GenericTools;

    }]);
