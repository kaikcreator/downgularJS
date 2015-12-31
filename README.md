# downgularJS
AngularJS library for downloading files and storing them locally. 

It's very simple to use: Just create a queue and add to it the urls of the files you want to download into that queue. You can start/stop the download process, and save/retrieve the queue in localStorage.

Only Google Chrome and Cordova/Phonegap (requires [official File Plugin](https://github.com/apache/cordova-plugin-file)) have right now implemented a FileSystem API, so this library is mainly focused on Chrome Extensions and Hybrid Apps, that can need to download images or other files to the device and store them permantently.

As it is an AngularJS module, it can be easily integrated with **Ionic Framework**.


**Happy coding!!**


#Install
You can install this package with bower.

1. From terminal, in your project's folder:
>$ **bower install downgularJS**

2. Add the downgular.js file into your html:

```html
<script src="bower_components/downgularjs/dist/downgular.js"></script>
```


>TIP: In case you are planning to use it with cordova, you'll also need to install File System Plugin

```bash
>$ cordova plugin add org.apache.cordova.file
```



# How it works

Using downgularJS is quite simple. Just follow the next steps:


## Add downgular.js file

Add into your html file:

```html
<script src="your-path/dist/downgular.js"></script>
```


## Inject downgularJS module
You should inject **downgularJS** module, in order to make the service available.


## Inject downgularQueue service
You should inject **downgularQueue** service inside the service or controller where you want to use it.


## Build a queue
To build a queue just do:

```javascript
var myQueue = downgularQueue.build('nameOfTheQueue', 'nameOfFolderToDownloadFiles', callbackOnDownload);
```

You can use different queues at the same time (for example, using a quick queue for thumbnails and another queue for big images).

Also, you can define a callback function that will be called when a file is downloaded. The downgularFileDownload model related with that download will be passed as argument. This callback is the perfect place with whatever post-download process you want to do with the file.


## Add files to download

In order to add a file to a downloadQueue, you have to do:

```javascript
myQueue.addFileDownload(info, url, fileUrl);
```

if you want the file to be added **at the end** of the queue,

or

```javascript
myQueue.addPriorityFileDownload(info, url, fileUrl);
```

if you want the file to be added **at the beginning** of the queue.


Where:

* **info** is a dictionary of any information you want to associate to that file
* **url** is the URL from which the file should be downloaded
* **fileUrl** Right now it's not used, but the idea is to be able to specify the filesystem route where the file should be stored (right now it is randomly generated)


## Start/stop downloads

To start the downloads of a queue, simply run:

```javascript
myQueue.startDownloading();
```

To stop the downloads of a queue, run:

```javascript
myQueue.stopDownloading();
```


## Save/Restore on localStorage

You can save and recover the download queue in local storage.
This can be extremely useful if you are downloading files inside an app, and the user closes the app, so when he opens it another time you can continue downloading them without loosing any data.

To save the queue in localstorage, simply run:

```javascript
myQueue.saveFileDownloads();
```

To recover the queue from localstorage, run:

```javascript
imagesQueue.loadFileDownloads();
```


# The downgularFileDownload Model:

Every time a URL is added to a download queue, a **downgularFileDownload** model is created with the following properties:

- info: HERE YOU CAN ADD WHATEVER INFORMATION YOU WANT
- url: the URL from which the file should be downloaded
- fileUrl: the filesystem route where the file is stored (it's created after being downloaded)
- isDownloading: whether the file is being currently downloaded or not
- retryTimes: the number of failed downloads of the file

So you can use the **info** property to add whatever metadata you want to that file (for example, relate that file to a productId), in order to easily identify the file once it has been downloaded.



# Configure file storage for downgularJS:
By default, downgular sets temporary storage and zero quota (as quota is not required for temp. allocation).

However, you can easily use **downgularFileToolsProvider** to request persistent memory and change the storage quota.
Just do the following in the config call of your module:

```javascript
.config(function(downgularFileToolsProvider) {
        /* configure storage details*/
        downgularFileToolsProvider.usePersistentMemory(true);
        downgularFileToolsProvider.setStorageQuota(20*1024*1024); //in order to request 20MB
    }
))

```


# Example
In the example folder you'll find a simple demonstration of how to:

* configure file storage for downloadJS
* load a list of files to download in a download queue
* start/stop the downloads
* save/retrieve queues persistently

As CORS headers are required to allow a website to download files from a different domain (the files in the example are several HD images found on google), the CORS issues is solved using corsproxy npm package, so if you want to try it:

Install corsproxy:
> npm install -g corsproxy

Run corsproxy (it will start at http://localhost:1337)
> corsproxy



# Development

## Devel dependencies
This project uses npm, so you can download all developer dependencies with:

> npm install 


## Testing
To run karma + jasmine tests available, simply go to *tests* folder and run:

> karma start conf.unit-tests.js


## Gulp

Some gulp utilities have been preset to JSHint code, concatenate the different files in **downgular.js** file, and copy the updated versions to *example* and *dist* folders.

Just run 

> gulp

from command line.

