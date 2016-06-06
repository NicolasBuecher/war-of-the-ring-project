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

        // List of little apps to show work in progress (appear in the carousel)
        $scope.previews = [
            { 'id': 1, 'name': 'Test1', 'date': 'Test1dzdzd de ibz deunuz dzakba adubiad', 'src': 'resources/textures/test-preview.png' },
            { 'id': 2, 'name': 'Test2', 'date': 'Test2', 'src': 'resources/textures/test-preview.png' },
            { 'id': 3, 'name': 'Test3', 'date': 'Test3', 'src': 'resources/textures/test-preview.png' },
            { 'id': 4, 'name': 'Helms Deep Model !', 'date': '13/03/2016', 'src': 'resources/textures/test-preview.png' },
            { 'id': 5, 'name': 'Test5', 'date': 'Test5', 'src': 'resources/textures/test-preview.png' },
            { 'id': 6, 'name': 'Test6', 'date': 'Test6', 'src': 'resources/textures/test-preview.png' },
            { 'id': 7, 'name': 'Test7', 'date': 'Test7', 'src': 'resources/textures/test-preview.png' },
            { 'id': 8, 'name': 'Test8', 'date': 'Test8', 'src': 'resources/textures/test-preview.png' },
            { 'id': 9, 'name': 'Test super méga trop ultra méga long encore et encore et encore super mega long', 'date': 'Test tout pareillement super méga ultra super long hehehehehehhebde deden', 'src': 'resources/textures/test-preview.png' },
        ];

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


        // Change url to switch to the game
        $scope.launchGame = function()
        {
            $location.path('game');
        };

        // Change url to switch to the selected preview
        $scope.launchPreview = function(id)
        {
            $location.path('previews/' + id);
        };

        // Make appear or disappear the shadow on the screen
        $scope.toggleShadow = function()
        {
            $scope.isShadowVisible = ! $scope.isShadowVisible;
        };

        // Return true if the preview on the left is preview i
        $scope.isLeft = function(i)
        {
            return i === ($scope.currentPreview - 1);
        };

        // Return true if the preview in the middle is preview i
        $scope.isCenter = function(i)
        {
            return i === $scope.currentPreview;
        };

        // Return true if the preview on the right is preview i
        $scope.isRight = function(i)
        {
            return i === ($scope.currentPreview + 1);
        };

        // Return true if the preview waiting on the left is preview i
        $scope.isWaitingLeft = function(i)
        {
            return i === ($scope.currentPreview -2 );
        };

        // Return true if the preview waiting on the right is preview i
        $scope.isWaitingRight = function(i)
        {
            return i === ($scope.currentPreview + 2);
        };

        // Return true if preview i is part of the five visible previews
        $scope.isPreviewVisible = function(i)
        {
            return (i >= ($scope.currentPreview - 2)) && (i <= ($scope.currentPreview + 2));
        };

        // Make the carousel turn by modifying the current variable
        // If b = true, turn to the left, otherwise, turn to the right
        $scope.moveCarousel = function(b)
        {
            if (b)
            {
                if ($scope.currentPreview >= $scope.previews.length)
                {
                    $scope.currentPreview = $scope.previews.length;
                }
                else
                {
                    $scope.currentPreview += 1;
                }
            }
            else
            {
                if ($scope.currentPreview <= 1)
                {
                    $scope.currentPreview = 1;
                }
                else
                {
                    $scope.currentPreview -= 1;
                }
            }
        };
        

        // Default state is without shadow
        $scope.isShadowVisible = false;

        // Default current preview is the most recent
        $scope.currentPreview = $scope.previews.length;

    });