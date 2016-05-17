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

        // Make appear or disappear the element bound to key
        $scope.toggle = function(key)
        {
            $scope.isVisible[key] = !$scope.isVisible[key];
        };


        // Paths are values for the select options
        $scope.paths = {};

        // Landscape select options
        $scope.paths["water"] = [
            { name: 'Ocean',        path: 'ocean_texture.jpg'           },
            { name: 'Points',       path: 'ocean_texture_points.jpg'    },
            { name: 'Carpet',       path: 'ocean_texture_carpet.jpg'    }
        ];
        $scope.paths["snow"] = [
            { name: 'Snow',         path: 'texture_snow.jpg'            }
        ];
        $scope.paths["rock"] = [
            { name: 'Light Rock',   path: 'texture_rock.jpg'            },
            { name: 'Dark Rock',    path: 'texture_rock2.jpg'           }
        ];
        $scope.paths["dirt"] = [
            { name: 'Dirt',         path: 'texture_dirt.jpg'            }
        ];
        $scope.paths["forest"] = [
            { name: 'Dark Green',   path: 'forest_texture.jpg'          },
            { name: 'Real',         path: 'forest_texture2.jpg'         }
        ];
        $scope.paths["trunk"] = [
            { name: 'Dark Brown',   path: 'trunk_texture3.jpg'          }
        ];
        $scope.paths["noise"] = [
            { name: 'Cloud',        path: 'cloudEffectTexture.png'      }
        ];
        $scope.paths["bump"] = [
            { name: 'Original',     path: 'landscape_bumpmap3.png'      },
            { name: 'Mountain',     path: 'heightmap1.png'              }
        ];

        // Territory select options
        $scope.paths["land"] = [
            { name: 'Soil',         path: 'land_texture.jpg'            },
            { name: 'Map',          path: 'board_game.png'              },
            { name: 'Sand',         path: 'texture_sand.jpg'            },
            { name: 'Grass',        path: 'texture_grass.jpg'           },
            { name: 'Grass2',       path: 'grass1.jpg'                  },
            { name: 'Grass3',       path: 'grass2.jpg'                  },
            { name: 'Grass4',       path: 'grass3.jpg'                  }
        ];


        // Set default landscape parameters
        $scope.landscapeParameters                          = {};

        $scope.landscapeParameters["textures"]              = {};
        $scope.landscapeParameters["textures"]["water"]     = { 'path': $scope.paths['water'][0].path,  'u': 3.0,   'v': 3.0    };
        $scope.landscapeParameters["textures"]["snow"]      = { 'path': $scope.paths['snow'][0].path,   'u': 50.0,  'v': 50.0   };
        $scope.landscapeParameters["textures"]["rock"]      = { 'path': $scope.paths['rock'][1].path,   'u': 500.0, 'v': 500.0  };
        $scope.landscapeParameters["textures"]["dirt"]      = { 'path': $scope.paths['dirt'][0].path,   'u': 500.0, 'v': 500.0  };
        $scope.landscapeParameters["textures"]["forest"]    = { 'path': $scope.paths['forest'][0].path, 'u': 100.0, 'v': 100.0  };
        $scope.landscapeParameters["textures"]["trunk"]     = { 'path': $scope.paths['trunk'][0].path,  'u': 500.0, 'v': 500.0  };
        $scope.landscapeParameters["textures"]["noise"]     = { 'path': $scope.paths['noise'][0].path,  'u': 10.0,  'v': 10.0   };
        $scope.landscapeParameters["textures"]["bump"]      = { 'path': $scope.paths['bump'][0].path,   'u': 1.0,   'v': 1.0    };

        $scope.landscapeParameters["floats"]                = {};
        $scope.landscapeParameters["floats"]["baseSpeed"]   = 0.01;
        $scope.landscapeParameters["floats"]["noiseScale"]  = 0.25;
        $scope.landscapeParameters["floats"]["alpha"]       = 0.93;
        $scope.landscapeParameters["floats"]["bumpScale"]   = 0.05;

        // Set default territory parameters
        $scope.territoryParameters                          = {};

        $scope.territoryParameters["textures"]              = {};
        $scope.territoryParameters["textures"]["land"]      = { 'path': $scope.paths['land'][5].path,   'u': 10.0,  'v': 10.0   };
        $scope.territoryParameters["textures"]["bump"]      = { 'path': $scope.paths['bump'][1].path,   'u': 1.0,   'v': 1.0    };

        $scope.territoryParameters["floats"]                = {};
        $scope.territoryParameters["floats"]["bumpScale"]   = 50.0;

        // Set default values
        $scope.isVisible                                    = {};
        $scope.isVisible['UI']                              = false;
        $scope.isVisible['landscape']                       = false;
        $scope.isVisible['territory']                       = false;


        // Store all parameters in one big object
        // Useful for using ng-repeat and sending data to the nbWebgl directive
        $scope.parameters                                   = {};
        $scope.parameters['landscape']                      = $scope.landscapeParameters;
        $scope.parameters['territory']                      = $scope.territoryParameters;

    });