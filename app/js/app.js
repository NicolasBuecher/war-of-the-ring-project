/**
 * Created by Nicolas Buecher on 27/03/2016.
 */

'use strict';

/**
 * Routing function
 */
angular.module('WarOfTheRingApp', ["ngRoute", "ngAnimate", "nbWebgl"])
    .config(function ($routeProvider) {

        $routeProvider
            .when('/', {
                templateUrl: 'templates/homepage.html',
                controller: 'HomepageController'
            })
            .when('/game', {
                templateUrl: 'templates/renderer.html',
                controller: 'RendererController'
            })
            .otherwise({
                redirectTo: '/'
            });

    });