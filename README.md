# downgularJS
Angular library for downloading files and storing them locally



#example
The example is a simple demonstration of how to:

* load a list of files to download in a download queue
* start/stop the downloads
* save/retrieve queues persistently

As CORS headers are required to allow a website to download files from a different domain (the files in the example are several HD images found on google), the CORS issues is solved using corsproxy npm package, so if you want to try it:

Install corsproxy:
> npm install -g corsproxy

Run corsproxy (it will start at http://localhost:1337)
> corsproxy
