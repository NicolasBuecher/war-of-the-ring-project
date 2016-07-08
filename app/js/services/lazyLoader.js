/**
 * Created by Nicolas Buecher on 16/06/2016.
 */

'use strict';

/**
 * Service lazyLoader
 *
 * Dynamically load files and inject them in the angular app
 */
angular.module('WarOfTheRingApp')
    .factory('lazyLoader', function($q)
    {
        // Initialize a dictionary to remember which files have already been loaded
        var lazyPromises = {};

        // lazyLoader service :
        return {
            // Load a JS file and return a promise resolved when the file is loaded
            loadJS: function(name, path)
            {
                // Create deferred to handle asynchronous operations
                var deferred = $q.defer();

                // Check if the file has already been loaded
                if (lazyPromises.hasOwnProperty(name))
                {
                    console.log("Warning : Multiple queries for the JS file " + name);
                    deferred.resolve();
                }
                else
                {
                    // Create a script element in DOM
                    var script = document.createElement('script');
                    script.type = 'text\/javascript';
                    script.async = true;
                    script.src = path + name + ".js";

                    // Resolve promise when the file is loaded
                    script.onload = function()
                    {
                        console.log("JS file " + name + " has been successfully lazy loaded.");
                        lazyPromises[name] = deferred.promise;
                        deferred.resolve();
                    };

                    // Reject the promise when an error occurs
                    script.onerror = function()
                    {
                        console.log("JS file " + name + " : Unable to lazy load the file, an error happened.")
                        deferred.reject();
                    };

                    // Add the script element to the header
                    var header = document.getElementsByTagName("head")[0];
                    header.appendChild(script);
                }

                // Return promise
                return deferred.promise;
            }
        }
    });