/**
 * Created by Nicolas Buecher on 11/06/2016.
 */

'use strict';

angular.module('WarOfTheRingApp')
    .factory('fileChecker', function ($http, $q)
    {

        return {
            checkURL: function(url) {
                // Create deferred to handle asynchronous operations
                var deferred = $q.defer();

                // Look for the file
                $http.head(url)
                    .then(
                        // successCallback
                        function ()
                        {
                            deferred.resolve();
                        },

                        // errorCallback
                        function ()
                        {
                            deferred.reject();
                        }
                    );

                // Return promise
                return deferred.promise;
            }
        }
        
    });