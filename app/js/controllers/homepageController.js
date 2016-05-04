/**
 * Created by Nicolas Buecher on 27/04/2016.
 */

'use strict';

/**
 * Controller Homepage
 *
 * Basic controller to manage the homepage of the app
 */
angular.module('WarOfTheRingApp')
    .controller('HomepageController', function ($scope, $location) {

        // List of people to thank in the credits
        $scope.credits = [
            {
                author: 'Mr.doob',
                thanks: 'the author of the ThreeJS library, for his huge work, his doc and all his great examples',
                link: 'http://mrdoob.com'
            },
            {
                author: 'stemkosky',
                thanks: 'the author of numerous ThreeJS examples, for his very useful work',
                link: ''
            },
            {
                author: 'Author 3',
                thanks: 'Thanks 3',
                link: 'Link 3'
            },
            {
                author: 'Author 4',
                thanks: 'Thanks 4',
                link: 'Link 4'
            }
        ];

        // Make appear or disappear the shadow on the screen
        $scope.toggleShadow = function() {
            $scope.isShadowVisible = ! $scope.isShadowVisible;
        };

        // Default state is without shadow
        $scope.isShadowVisible = false;

        // Change url to switch to the game
        $scope.launchGame = function() {
            $location.path('game');
        };

    });