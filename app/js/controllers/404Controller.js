/**
 * Created by Nicolas Buecher on 19/06/2016.
 */

'use strict';

/**
 * Controller 404
 *
 * Basic controller to manage the 404 status
 */
angular.module('WarOfTheRingApp')
    .controller('404Controller', function ($scope, $location) {
        
        // Change url to switch to go back to the main page
        $scope.goBack = function()
        {
            $location.path('/');
        }
        
    });
