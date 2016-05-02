/**
 * Created by Nicolas Buecher on 13/04/2016.
 */

'use strict';

/**
 * Service shaderLoader
 *
 * Return one or more shader file stored in the 'shaders' folder by passing their names
 */
angular.module('WarOfTheRingApp')
    .factory('shaderLoader', function($http, $q)
    {
        // Initialize a dictionnary to store the shaders as 'shaderName: string'
        var shaders = {};


        // Return the shader contained in the txt file requested
        var loadShader = function(shaderName)
        {
            // Create deferred to handle asynchronous operations
            var deferred = $q.defer();

            // Notify progress of the operation (doesn't work when called just after deferred instantiation)
            deferred.notify("About to load shader " + shaderName);

            // Check if the file has already been downloaded
            if (shaders.hasOwnProperty(shaderName))
            {
                console.log("Warning : Multiple queries for the shader " + shaderName);
                deferred.resolve(shaders[shaderName]);
            }
            else
            {
                // Get the file
                $http.get('shaders/' + shaderName)
                    .then(

                        // Callback when file is loaded
                        function(data)
                        {
                            console.log("Shader " + shaderName + " has been successfully loaded.");
                            deferred.resolve(data.data);
                            shaders[shaderName] = data.data;
                        },

                        // Callback when downloading is on progress (todo)
                        null,

                        // Callback when downloading leads to an error
                        function(data)
                        {
                            console.log( "Shader " + shaderName + " : Unable to load the shader, an error happened.");
                            deferred.reject();
                        }
                    );
            }

            // Return promise
            return deferred.promise;
        };


        // shaderLoader service :
        return {

            // Return the shader corresponding to shaderName in a promise
            getShader: function(shaderName)
            {
                //Return the shader inside a promise
                return loadShader(shaderName);
            },

            // Return an array of shaders corresponding to shaderNames in a promise
            getShaders: function(shaderNames) {

                // Initialize an array to contain the promises
                var promises = [];

                // Iterate on each shaderName provided
                for (var i = 0; i < shaderNames.length; i++)
                {
                    // Get the shader inside a promise and add it to the array of promises
                    promises.push(loadShader(shaderNames[i]));
                }

                // Return all promises as one promise
                return $q.all(promises);

            }

        }
    });
