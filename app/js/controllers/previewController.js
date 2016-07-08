/**
 * Created by Nicolas Buecher on 05/06/2016.
 */

'use strict';

/**
 * Controller Preview
 *
 * Basic controller to manage the dynamically loaded preview and its features
 */
angular.module('WarOfTheRingApp')
    .controller('PreviewController', function ($scope, $routeParams, $injector, previewManager) {

        $scope.previewId = $routeParams.previewId;

        previewManager.injectPreview($scope.previewId);
        
        $injector.get('preview' + $scope.previewId).test(); // usecase

    });