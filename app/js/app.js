/**
 * Created by Nicolas Buecher on 27/03/2016.
 */

'use strict';

/**
 * Routing function
 */
angular.module('WarOfTheRingApp', ["ngRoute", "ngAnimate", "nbWebgl", "nbPreview", "capitalize"])
    .config(function ($routeProvider, $provide) {

        // Register factory provider for further use (once the application is bootstrapped)
        angular.module('WarOfTheRingApp').factory = $provide.factory;

        // Handle route cases
        $routeProvider
            .when('/', {
                templateUrl: 'templates/homepage.html',
                controller: 'HomepageController'
            })
            .when('/game', {
                templateUrl: 'templates/renderer.html',
                controller: 'RendererController'
            })
            .when('/previews/:previewId', {
                templateUrl: 'templates/preview.html',
                controller: 'PreviewController',
                resolve: {
                    preview: function($location, $route, lazyLoader) {

                        // Get the preview id from the route params
                        var id = $route.current.params.previewId;

                        // Lazy load the preview
                        var promise = lazyLoader.loadJS('preview' + id, 'js/services/previews/');

                        // Redirect to 404 page if promise is rejected
                        promise.then(
                            function(data)
                            {
                                //previewManager.addPreview(id);
                            },
                            function(data)
                            {
                                $location.path('/404');
                                $location.replace();        // This trick allows to use back button after redirecting to 404 page
                            }
                        );

                        // Resolve the route dependencies by returning the promise
                        return promise;
                    }
                }
            })
            .when('/404', {
                templateUrl: 'templates/404.html',
                controller: '404Controller'
            })
            .otherwise({
                redirectTo: '/'
            });

    });
