/**
 * Created by Nicolas Buecher on 29/03/2016.
 */

'use strict';

/**
 * Service territoryLoader
 *
 * Return one or more territory json data stored in the 'resources/territories' folder
 */
angular.module('WarOfTheRingApp')
    .factory('territoryLoader', function($http, $q)
    {
        // Initialize a dictionnary to store the territory data as 'territoryId: JSONObject' (and 'territories: [JSONObject]')
        var territoryData = {};

        // Initialize a constant that represents the number of territories
        var NB_TERRITORIES = 105;


        // Return the data contained in the JSON territory file requested
        var loadTerritoryData = function(id)
        {
            // If id is undefined, we look for the fil 'territories.json'
            var suffixe = id===undefined?"ies":"y"+id;

            // Create deferred to handle asynchronous operations
            var deferred = $q.defer();

            // Notify progress of the operation (doesn't work when called just after deferred instantiation)
            deferred.notify("About to load file territor" + suffixe + ".json");

            // Check if the file has already been downloaded
            if (territoryData.hasOwnProperty("territor" + suffixe))
            {
                console.log("Warning : Multiple queries for the file territor" + suffixe + ".json");
                deferred.resolve(territoryData["territor" + suffixe]);
            }
            else
            {
                // Get the file
                $http.get('resources/territories/territor' + suffixe + '.json')
                    .then(

                        // Callback when file is loaded
                        function(data)
                        {
                            console.log("File territor" + suffixe + ".json has been successfully loaded.");
                            deferred.resolve(data.data);
                            territoryData["territor" + suffixe] = data.data;
                        },

                        // Callback when downloading is on progress (todo)
                        null,

                        // Callback when downloading leads to an error
                        function(data)
                        {
                            console.log( "File territor" + suffixe + ".json : Unable to load the file, an error happened.");
                            deferred.reject();
                        }
                    );
            }

            // Return promise
            return deferred.promise;
        };

        
        // territoryLoader service :
        return {

            // Return an array of territory objects from the JSON file territory.json
            getTerritories: function()
            {
                //Return the territory data in a promise
                return loadTerritoryData();
            },

            // Return a territory object from the JSON file corresponding to the id
            getTerritoryById: function(id)
            {
                // Return the territory data in a promise
                return loadTerritoryData(id);
            },

            // Return an array of territory objects from the JSON files corresponding to the ids
            getTerritoriesByIds: function(ids)
            {
                // Initialize an array to contain the promises
                var promises = [];

                // Iterate on each id provided
                for (var i = 0; i < ids.length; i++)
                {
                    // Get the territory data inside a promise and add it to the array of promises
                    promises.push(loadTerritoryData(ids[i]));
                }

                // Return all promises as one promise
                return $q.all(promises);
            },

            // Return an array of territory objects from the JSON files corresponding to the ids from id1 to id2
            getTerritoriesFromAToB: function(id1, id2)
            {
                // Initialize an array to contain the promises
                var promises = [];

                // Check if the arguments are
                if ((id1 <= id2) && (id1 > 0) && (id2 <= NB_TERRITORIES))
                {
                    // Iterate on each id asked
                    for (var i = id1; i < id2 + 1; i++)
                    {
                        // Get the territory data inside a promise and add it to the array of promises
                        promises.push(loadTerritoryData(i));
                    }

                    // Return all promises as one promise
                    return $q.all(promises);
                }
                else
                {
                    console.log("Warning : Wrong ids passed to getTerritoriesFromAToB function !");

                    // Return a rejected promise
                    var deferred = $q.defer();
                    deferred.reject();
                    return deferred.promise;
                }
            }

        }
    });
