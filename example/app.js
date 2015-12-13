
angular.module("myApp", ["downgularJS"])

.config( [
    '$compileProvider', '$httpProvider', 'downgularFileToolsProvider',
    function( $compileProvider, $httpProvider, downgularFileToolsProvider ) {
        //allow images to be loaded from filesystem
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|file|blob|filesystem):|data:image\//);
        
        /* configure storage details*/
        downgularFileToolsProvider.usePersistentMemory(true);
        downgularFileToolsProvider.setStorageQuota(30*1024*1024);
    }
])

  .controller("main", ['$scope', 'downgularQueue', function($scope, downgularQueue) {
  
      var imagesQueue;
      var imageURLs = [
          "http://localhost:1337/www.hdwallpapers.in/walls/sleepy_kitten-wide.jpg",
          "http://localhost:1337/kpbs.media.clients.ellingtoncms.com/img/news/tease/2014/08/20/Cute_grey_kitten.jpg",
          "http://localhost:1337/upload.wikimedia.org/wikipedia/commons/a/a5/Red_Kitten_01.jpg",
          "http://localhost:1337/www.androscogginanimalhospital.com/blog/wp-content/uploads/2013/12/kitten-photo.jpg",
          "http://localhost:1337/upload.wikimedia.org/wikipedia/commons/d/d3/Little_kitten.jpg",
          "http://localhost:1337/www.sfgov2.org/ftp/uploadedimages/acc/Adoption_Center/Foster%20Kitten%2012007.jpg",
          "http://localhost:1337/upload.wikimedia.org/wikipedia/commons/b/bd/Golden_tabby_and_white_kitten_n01.jpg",
          "http://localhost:1337/www.hdwallpaperscool.com/wp-content/uploads/2015/02/kitten-wool-ball-high-definition-wallpaper-for-desktop-background.jpg",
          "http://localhost:1337/miriadna.com/desctopwalls/images/max/Grey-kitten.jpg",
          "http://localhost:1337/img1.wikia.nocookie.net/__cb20140227161247/creepypasta/images/f/f0/Cats-and-kittens-wallpapers-hdkitten-cat-big-cat-baby-kitten-sleep-2560x1024px-hd-wallpaper--cat-umizfbaa.jpg"
                      ];
      $scope.view = {};

      $scope.view.images = [];
      $scope.view.downloadsStarted = false;

      var updateViewImages = function(fileDownload){
        $scope.view.images.push(fileDownload.fileUrl);
        $scope.$apply();
      }

      $scope.startStop = function(){
        $scope.view.downloadsStarted = !$scope.view.downloadsStarted;
        if($scope.view.downloadsStarted)
          imagesQueue.startDownloading();
        else
          imagesQueue.stopDownloading();        
      }

      //add images to download
      $scope.init = function(){
        for(var i=0; i < imageURLs.length; i++){
          imagesQueue.addFileDownload({'imageId': i}, imageURLs[i], "");
        }
      };

      $scope.save = function(){
        imagesQueue.saveFileDownloads();
      }  

      $scope.retrieve = function(){
        imagesQueue.loadFileDownloads();
      }    

      angular.element(document).ready(function (){
        imagesQueue = downgularQueue.build('images1', 'tempDir1', updateViewImages);

        //set pending downloads from local storage
        imagesQueue.loadFileDownloads();

      });
      
}]);



