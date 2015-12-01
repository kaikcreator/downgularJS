describe('FileTools tests', function(){
    
    console.log("[TESTING]: Initializing FileTools tests");
    
    beforeEach(module("downgularJS"));
    

    var FileTools;
    
    beforeEach(inject(function (_FileTools_) {
                FileTools = _FileTools_;
            }));
    
    
    // Test 1: Create an object and check that it is defined
    it("get filesystem reference", function(done) {
        FileTools.getFileSystemEntry().then(function(fileEntry){
            expect(fileEntry).toBeDefined();
            console.log("file entry: " + fileEntry);
            done();
        }, function(error){
            fail("unexpected error when retrieving fileSystem " + error);
            
        });
        
    });


    
});