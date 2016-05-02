/**
 * Created by Nicolas Buecher on 27/03/2016.
 */

'use strict';

/**
 * Controller Renderer
 *
 * Allow the user to select some options for the render
 */
angular.module('WarOfTheRingApp')
    .controller('RendererController', function ($scope) {

        // Select options to choose the water texture
        $scope.oceanTextures = [
            {   name: 'Ocean',    path: 'ocean_texture.jpg'      },
            {   name: 'Points',   path: 'ocean_texture_points.jpg'     },
            {   name: 'Carpet',   path: 'ocean_texture_carpet.jpg'     }
        ];

        // Select options to choose the land texture
        $scope.landTextures = [
            {   name: 'Soil',     path: 'land_texture.jpg'        },
            {   name: 'Map',      path: 'board_game.png'          },
            {   name: 'Sand',     path: 'texture_sand.jpg'        },
            {   name: 'Grass',    path: 'texture_grass.jpg'       },
            {   name: 'Grass2',   path: 'grass1.jpg'              },
            {   name: 'Grass3',   path: 'grass2.jpg'              },
            {   name: 'Grass4',   path: 'grass3.jpg'              },
        ];

        // Set default textures
        $scope.oceanTexture = $scope.oceanTextures[0].path;
        $scope.landTexture = $scope.landTextures[0].path;
        $scope.mountainBumpScale = 50.0;

    });