const EventEmitter = require('events');
const fs = require('fs');
const child_process = require('child_process');
const _ = require('lodash');
const os = require('os');
const path = require('path');

const emitter = new EventEmitter();

let channel, errorChannel

function IconExtractor(){

  const self = this;
  let iconDataBuffer = "";

  this.emitter = new EventEmitter();
  this.iconProcess = child_process.spawn(getPlatformIconProcess(),['-x']);

  this.getIcon = function(context, path, channel = 'icon', errorChannel = 'error'){
    channel = channel
    errorChannel = errorChannel
    const json = JSON.stringify({context: context, path: path}) + "\n";
    self.iconProcess.stdin.write(json);
  }

  this.iconProcess.stdout.on('data', function(data){

    var str = (new Buffer(data, 'utf8')).toString('utf8');

    iconDataBuffer += str;

    //Bail if we don't have a complete string to parse yet.
    if (!_.endsWith(str, '\n')){
      return;
    }

    //We might get more than one in the return, so we need to split that too.
    _.each(iconDataBuffer.split('\n'), function(buf){

      if(!buf || buf.length == 0){
        return;
      }

      try{
        self.emitter.emit(channel, JSON.parse(buf));
      } catch(ex){
        self.emitter.emit('error', ex);
      }

    });
  });

  this.iconProcess.on('error', function(err){
    self.emitter.emit(errorChannel, err.toString());
  });

  this.iconProcess.stderr.on('data', function(err){
    self.emitter.emit(errorChannel, err.toString());
  });

  function getPlatformIconProcess(){
    if(os.type() == 'Windows_NT'){
      return path.join(__dirname,'/bin/IconExtractor.exe');
      //Do stuff here to get the icon that doesn't have the shortcut thing on it
    } else {
      throw('This platform (' + os.type() + ') is unsupported =(');
    }
  }

}

module.exports = new IconExtractor();
