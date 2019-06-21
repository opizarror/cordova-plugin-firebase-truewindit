"use strict";

var path = require("path");
var AdmZip = require("adm-zip");

var utils = require("./utilities");

var constants = {
  googleServices: "google-services",
  folderNamePrefix: "firebase."
};

module.exports = function(context) {
  var cordovaAbove8 = utils.isCordovaAbove(context, 8);
  var cordovaAbove7 = utils.isCordovaAbove(context, 7);
  var defer;
  if (cordovaAbove8) {
    defer = require('q').defer();
  } else {
    defer = context.requireCordovaModule("q").defer();
  }
  
  var appId = utils.getAppId(context);

  var platform = context.opts.plugin.platform;
  var platformConfig = utils.getPlatformConfigs(platform);
  if (!platformConfig) {
    utils.handleError("Invalid platform", defer);
  }

  var wwwPath = utils.getResourcesFolderPath(context, platform, platformConfig);
  var sourceFolderPath;

 if (cordovaAbove7) {
    wwwPath = path.join(context.opts.projectRoot, "www");
  } else {
    wwwPath = utils.getResourcesFolderPath(context, platform, platformConfig);
  }
  
  var sourceZipName = constants.folderNamePrefix + appId + "." + constants.googleServices; 
  var googleServicesZipFile = utils.getZipFile(wwwPath, sourceZipName);
  
  if (!googleServicesZipFile) {
    utils.handleError("No zip file found containing google services configuration file", defer);
  }

  var zip = new AdmZip(googleServicesZipFile);

  var targetPath = path.join(wwwPath, constants.googleServices);
  zip.extractAllTo(targetPath, true);

  var files = utils.getFilesFromPath(targetPath);
  if (!files) {
    utils.handleError("No directory found");
  }

  var fileName = files.find(function (name) {
    return name.endsWith(platformConfig.firebaseFileExtension);
  });
  if (!fileName) {
    utils.handleError("No file found");
  }

  var sourceFilePath = path.join(targetPath, fileName);
  var destFilePath = path.join(context.opts.plugin.dir, fileName);

  utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePath);

  if (cordovaAbove7) {
    var destPath = path.join(context.opts.projectRoot, "platforms", platform, "app");
    if (utils.checkIfFolderExists(destPath)) {
      var destFilePath = path.join(destPath, fileName);
      utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePath);
    }
  }
      
  return defer.promise;
}
