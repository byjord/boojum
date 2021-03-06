import {constantMap, CREATED} from './constants';
import {isUnixHiddenFolder, isUnixHiddenFile} from './utils';

function Handler(context) {
  this.context = context;
  this.debug = this.context.debug;
}

Handler.prototype.start = function(events) {
  // If in array we send the data to
  // the resolver that knows arrays
  if(Array.isArray(events)) {
    return this._resolveArrays(events);
  }

  // Else we assume singleton and send
  // to the singleton resolver
  return this._resolveSignleton(events);
};

Handler.prototype._resolveArrays = function(events) {
  // Because we know the `events` variable is an array
  // of objects, we simply illiterate over them and send
  // each object over to the `_in` function
  events.forEach(( stalkerEvent ) => {
    return this._in(stalkerEvent);
  });
};

Handler.prototype._resolveSignleton = function(stalkerEvent) {
  // Because we know the `events` variable is a single object
  // we send it straight over to the `_in` function
  return this._in(stalkerEvent);
};

Handler.prototype._in = function({action, directory, file}) {
  // Now we have an indevidual NSFW object we can return a Promise
  // and start working on checking it against our ignore lists
  // & if nothing bad happens (reject) then we'll send it off to the
  // `sendNotification` handler which will trigger a Emit.
  return Promise.resolve({action, directory, file})
    .then(this.__convertNSFWActionToBoojumConstant)
    .then(this.__ignoredActions)
    .then(this.__ignoredSystemFolders)
    .then(({action, directory, file}) => {
      // If we made it this far without rejecting
      // we can safely assume that we care about this.
      // Use main stalker context to send an emit
      // using the Boojum constants.
      return this.context.emit(action, [directory, file]);
    })
    .catch((e) => {
      console.log(e);
    });
};

Handler.prototype.__convertNSFWActionToBoojumConstant = function({action, directory, file}) {
  const boojumConstant = constantMap[action];

  return {
    action: boojumConstant,
    directory,
    file,
  };
};

// Ignore some actions from NSFW
Handler.prototype.__ignoredActions = function({action, directory, file}) {
  const rejection = {
    reason: `The actions type ${action} is ignored by Boojum`,
    extra: "See lib/controllers/stalker/handlers.js function Handler.prototype.__ignoredActions",
    action,
    directory,
    file,
  };

  if(action == CREATED) {
    return Promise.reject(rejection);
  }

  return {action, directory, file};
};

// Ignore system folders using regex
// We currently ignore any directory that starts with a `.` dot
Handler.prototype.__ignoredSystemFolders = function({action, directory, file}) {
  let rejection = {
    reason: "", // Default reason
    extra: "See lib/controllers/stalker/handlers.js function Handler.prototype.__ignoredSystemFolders",
    action,
    directory,
    file,
  };

  // Unix hidden folders (`.*`)
  if(isUnixHiddenFolder(directory)) {
    rejection.reason = "Hidden directories (.*) are ignored by Boojum by default";
    return Promise.reject(rejection);
  }

  // Hidden files
  if(isUnixHiddenFile(file)) {
    rejection.reason = "Files using hidden paths (.*) are ignored by Boojum by default";
    return Promise.reject(rejection);
  }

  return {action, directory, file};
};

export default Handler;
