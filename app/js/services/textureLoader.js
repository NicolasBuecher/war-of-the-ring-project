/**
 * Created by Nicolas Buecher on 09/04/2016.
 */

'use strict';

/**
 * Service textureLoader
 *
 * Return one or more Three.js Texture stored in the 'textures' folder by passing their names
 */
angular.module('WarOfTheRingApp')
    .factory('textureLoader', function($q)
    {
        // Initialize a dictionnary to store the textures as 'textureName: THREE.Texture'
        var textures = {};

        // Create a one THREE TextureLoader for all calls
        var textureLoader = new THREE.TextureLoader();


        // Return an unique texture in a promise, can be used by both getTexture and getTextures functions
        var loadTexture = function(textureName) {

            // Create deferred to handle asynchronous operations
            var deferred = $q.defer();

            // Notify progress of the operation (doesn't work when called just after deferred instantiation)
            deferred.notify("About to load texture " + textureName);

            // Check if the texture has already been downloaded
            if (textures.hasOwnProperty(textureName))
            {
                console.log("Warning : Multiple queries for the file " + textureName);
                deferred.resolve(textures[textureName]);
            }
            else
            {
                // Load texture
                textureLoader.load(

                    // Resource URL
                    'textures/' + textureName,

                    // Callback when texture is loaded
                    function(texture)
                    {
                        console.log("Texture " + textureName + " has been successfully loaded.");
                        deferred.resolve(texture);
                        textures[textureName] = texture;
                    },

                    // Callback when downloading is on progress (doesn't work until now, deleted)
                    null,

                    // Callback when downloading leads to an error
                    function(xhr)
                    {
                        console.log( "Texture" + textureName + " : Unable to load the texture, an error happened.");
                        deferred.reject();
                    }

                );
            }

            // Return promise
            return deferred.promise;

        };


        // textureLoader service :
        return {

            // Return the texture corresponding to textureName in a promise
            getTexture: function(textureName) {

                // Return the texture inside a promise
                return loadTexture(textureName);

            },

            // Return an array of textures corresponding to textureNames in a promise
            getTextures: function(textureNames) {

                // Initialize an array to contain the promises
                var promises = [];

                // Iterate on each textureName provided
                for (var i = 0; i < textureNames.length; i++)
                {
                    // Get the texture inside a promise and add it to the array of promises
                    promises.push(loadTexture(textureNames[i]));
                }

                // Return all promises as one promise
                return $q.all(promises);

            }
        }

    });
