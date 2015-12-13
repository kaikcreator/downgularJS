describe('downgularFileTools tests', function(){
    
    console.log("[TESTING]: Initializing downgularFileTools tests");
    
    beforeEach(module("downgularJS"));
    

    var downgularFileTools;
    var $rootScope;
    
    beforeEach(inject(function (_downgularFileTools_, _$rootScope_) {
                downgularFileTools = _downgularFileTools_;
                $rootScope = _$rootScope_;
            }));
    
    
    // Test 1: Create an object and check that it is defined
    it("get filesystem reference", function(done) {
        console.log("Test get file system entry");
        downgularFileTools.getFileSystemEntry().then(function(fileEntry){
            expect(fileEntry).toBeDefined();
            done();
        }, function(error){
            fail("unexpected error when retrieving fileSystem " + error);
            
        });
        
        //force promise to get executed
        setInterval($rootScope.$digest, 100);
        
    });


    
});