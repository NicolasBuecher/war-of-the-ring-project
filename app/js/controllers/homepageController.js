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
                author: 'Ricardo Cabello',
                thanks: 'alias mrdoob on github, author of the ThreeJS library, for his huge work, his doc and all his great examples',
                link: 'http://mrdoob.com'
            },
            {
                author: 'Lee Stemkoski',
                thanks: 'alias stemkoski on github, author of numerous ThreeJS examples, for his very useful work',
                link: 'http://home.adelphi.edu/~stemkoski/'
            },
            {
                author: 'Paul Drumdorf',
                thanks: 'author of the one ring 3D model (used as an image here)',
                link: 'https://www.cgtrader.com/drumdorf'
            },
            {
                author: 'Karacas',
                thanks: 'author of ThreeJS logo (as the library doesn\'t have one yet)',
                link: 'https://dribbble.com/karacas'
            },
            {
                author: 'Dave Gandy',
                thanks: 'author of Github and Linkedin icons',
                link: 'http://www.flaticon.com/authors/dave-gandy'
            },
            {
                author: 'OCHA',
                thanks: 'author of mail icon',
                link: 'http://www.flaticon.com/authors/ocha'
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