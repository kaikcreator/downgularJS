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