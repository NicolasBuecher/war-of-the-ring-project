/**
 * Created by Nicolas Buecher on 27/03/2016.
 */

'use strict';

/**
 * Directive nbWebgl
 *
 * Initialize a Three.js Scene and render it
 */
angular.module("nbWebgl", [])
    .directive(
        "nbWebgl",
        [
            'textureLoader',
            'geometryBuilder',
            function (textureLoader, geometryBuilder)
            {
                return {

                    // Directive can be used as an element or as an attribute
                    restrict: "A",          // When used as an element, pan doesn't work as it should, so ues it as an attribute

                    // Create an isolate scope for this directive
                    scope: {
                        'oceanTextureChoice': '=oceanTexture',       // Pay attention to the FUCKING NORMALIZATION : some-thing becomes someThing !
                        'landTextureChoice': '=landTexture',          // 'isolateProperty': '=normalizedProperty' and in the DOM future-normalized-property="parentProperty"
                        'mountainBumpScaleValue': '=mountainBumpScale'
                    },

                    // This isolate scope will use its own controller
                    controller: function($scope, $document, $timeout, territoryLoader, textureLoader, shaderLoader)
                    {

                        // Load textures and get a promise to use it right after it has been loaded
                        $scope.texturePromise = textureLoader.getTextures(['land_texture.jpg', 'texture_dirt.jpg', 'texture_sand.jpg', 'texture_grass.jpg', 'texture_rock.jpg', 'texture_snow.jpg', 'heightmap1.png', "ocean_texture.jpg", "cloudEffectTexture.png", "depthmap.png"]);

                        // Load territory data and get a promise to use it right after it has been loaded
                        $scope.territoryPromise = territoryLoader.getTerritories();

                        // Load shaders ang get a promise to use it right after it has been loaded
                        $scope.shaderPromise = shaderLoader.getShaders(["vertex_shader", "fragment_shader", "vertex_shader_water", "fragment_shader_water"]);

                        // Bind "keypress" event to window.document to handle keyboard events
                        // No other way to do it since other ways only work on input elements
                        $document.bind('keypress', function(key)
                        {
                            console.log(key.which);
                            // Broadcasting / Emitting to webgl app ? Or just change a variable ?
                        });

                    },

                    // Function called for each instance of the directive, manipulate DOM here
                    link: function (scope, elem, attr)
                    {

                        // INIT ALL THAT'S POSSIBLE BEFORE USING PROMISES

                        // Declare standard global variables
                        var camera;
                        var controls;
                        var scene;
                        var renderer;
                        var clock;

                        // Declare custom global variables
                        var waterTexture;
                        var frontTerritoryTexture;
                        var extrudeSettings;


                        // Initialize the scene
                        init();


                        function init()
                        {
                            // Initialize the clock
                            clock = new THREE.Clock();


                            // Initialize camera and scene
                            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
                            camera.position.set(0, 0, 1000);
                            scene = new THREE.Scene();


                            // Initialize extrude settings
                            extrudeSettings = {
                                curveSegments: 1,
                                steps: 1,
                                amount: 2,
                                bevelEnabled: false,
                                bevelThickness: 0.5,
                                bevelSize: 0.5,
                                bevelSegments: 1,
                                material: 0,
                                extrudeMaterial: 1
                            };


                            // Create and start the renderer
                            renderer = new THREE.WebGLRenderer();
                            renderer.setSize(window.innerWidth, window.innerHeight);
                            elem[0].appendChild(renderer.domElement);


                            // Add events
                            window.addEventListener('resize', onWindowResize, false);


                            // Finally initialize the controls
                            // Has to be done AFTER the appendChild(renderer.domElement) call
                            // otherwise, you will lose the pan and rotate controls
                            controls = new THREE.TrackballControls(camera, elem[0]);

                        }


                        // GEOMETRY AND TEXTURES, USE PROMISES


                        // Initialize a basic directional light
                        scene.add(new THREE.AmbientLight(0xffffff));
                        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
                        directionalLight.position.x = 0;
                        directionalLight.position.y = 0;
                        directionalLight.position.z = 10;
                        directionalLight.position.normalize();
                        scene.add(directionalLight); // what about a service for the light?


                        // Create the border mesh
                        var borderGeometry = geometryBuilder.getBorders();
                        var borderMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
                        var borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
                        scene.add(borderMesh);


                        // Create the background mesh
                        var backgroundGeometry = new THREE.PlaneGeometry(1000, 680, 100, 68);
                        var backgroundUniforms = {
                            baseTexture: { type: "t" },
                            baseSpeed: { type: "f", value: 0.1 },
                            noiseTexture: { type: "t" },
                            noiseScale: { type: "f", value: 0.05 },
                            dirtTexture: { type: "t" },
                            depthmap: { type: "t" },
                            alpha: { type: "f", value: 0.9 },
                            time: { type: "f", value: 1.0 }
                        };
                        var backgroundMaterial = new THREE.ShaderMaterial(
                            {
                                uniforms: backgroundUniforms
                            }
                        );
                        var backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
                        scene.add(backgroundMesh);


                        // Initialize geometry and material for the territory meshes
                        var territoryGeometries = [];
                        var frontTerritoryMaterial = new THREE.MeshPhongMaterial();
                        var backTerritoryMaterial = new THREE.MeshPhongMaterial({ visible: false });
                        var sideTerritoryMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
                        var territoryMaterials = [frontTerritoryMaterial, sideTerritoryMaterial, backTerritoryMaterial];
                        var territoryMaterial = new THREE.MeshFaceMaterial(territoryMaterials);
                        var territoryMeshes = [];

                        // Initialize geometry and material for the outline meshes
                        var outlineGeometries = [];
                        var outlineMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
                        var outlineMeshes = [];

                        // Initialize geometry and material for the mountain outline meshes
                        var mountainOutlineGeometries = [];
                        var mountainOutlineMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
                        var mountainOutlineMeshes = [];

                        // Initialize geometry and material for the frontier meshes
                        var frontierGeometries = [];

                        var dwarfFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0x4A2300 });
                        var elfFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0x67DE59 });
                        var gondorFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0x0F1759 });
                        var isengardFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0xF3D720 });
                        var northFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0x399CC0 });
                        var rohanFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0x13420D });
                        var sauronFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0xD90000 });
                        var easterlingsFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0xF77F2F });
                        var defaultFrontierMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

                        var frontierMaterial = [
                            dwarfFrontierMaterial,
                            elfFrontierMaterial,
                            gondorFrontierMaterial,
                            isengardFrontierMaterial,
                            northFrontierMaterial,
                            rohanFrontierMaterial,
                            sauronFrontierMaterial,
                            easterlingsFrontierMaterial,
                            defaultFrontierMaterial
                        ];

                        var frontierMeshes = [];

                        // Initialize geometry and material for the mountain meshes
                        //var mountainGeometries = geometryBuilder.getMountains();
                        //var mountainUniforms = { blabla: { type: "t" } }
                        //var mountainMaterial = {new THREE.ShaderMaterial({ uniforms: mountainUniforms });
                        //var mountainMeshes = [];
                        //for (var i = 0; i < mountainGeometries.length; i++) {
                        //var mountainMesh = new THREE.Mesh(mountainGeometries[i], mountainMaterial);
                        //mountainMeshes.push(mountainMesh);
                        //}
                        //var mountainBumpTexture = new THREE.TextureLoader().load('textures/heightmap1.png');
                        //var mountainBumpScale = 50.0;
                        var mountainGeometry = new THREE.PlaneGeometry(365, 235, 73, 47);

                        var mountainUniforms = {
                            bumpTexture: { type: "t"/*, value: mountainBumpTexture*/ },
                            bumpScale: { type: "f", value: scope.mountainBumpScaleValue },
                            dirtTexture: { type: "t"/*, value: dirtTexture*/ },
                            sandTexture: { type: "t"/*, value: sandTexture*/ },
                            grassTexture: { type: "t"/*, value: grassTexture*/ },
                            rockTexture: { type: "t"/*, value: rockTexture*/ },
                            snowTexture: { type: "t"/*, value: snowTexture*/ }
                        };
                        var mountainMaterial = new THREE.ShaderMaterial(
                            {
                                uniforms: mountainUniforms
                            }
                        );
                        var mountainMesh = new THREE.Mesh(mountainGeometry, mountainMaterial);
                        scene.add(mountainMesh);
                        var mountainMeshes = [];
                        var ratioY = 1415 / 680;
                        for (var i = 0; i < mountainMesh.geometry.vertices.length; i++)
                        {
                            mountainMesh.geometry.vertices[i].x = mountainMesh.geometry.vertices[i].x + 490 + 365/2;
                            mountainMesh.geometry.vertices[i].y = mountainMesh.geometry.vertices[i].y + 390 + 235/2;
                            mountainMesh.geometry.vertices[i].x = (mountainMesh.geometry.vertices[i].x-1035) / 2.07;
                            mountainMesh.geometry.vertices[i].y = (mountainMesh.geometry.vertices[i].y-707.5) / ratioY;
                        }

                        mountainMesh.translateZ(-26);


                        // Initialize an array to contain all the territories bound to their corresponding outlines, mountains and frontiers
                        var territories = [];


                        // Create the territory meshes, including their outlines, mountains and frontiers
                        scope.territoryPromise.then(function(territoryData)
                        {












                            // TESTS just some info about territory geometries
                            var maxXs = [];
                            var maxYs = [];
                            var minXs = [];
                            var minYs = [];

                            for (var i = 0; i < territoryData.length; i++)
                            {
                                var maxX = 0;
                                var maxY = 0;
                                var minX = 2070;
                                var minY = 1415;

                                for (var j = 0; j < territoryData[i].geometry.length; j++)
                                {

                                    for (var k = 0; k < territoryData[i].geometry[j].length / 2; k++)
                                    {
                                        if (territoryData[i].geometry[j][2*k] > maxX)
                                        {
                                            maxX = territoryData[i].geometry[j][2*k];
                                        }
                                        if (territoryData[i].geometry[j][2*k] < minX)
                                        {
                                            minX = territoryData[i].geometry[j][2*k];
                                        }
                                        if (territoryData[i].geometry[j][2*k+1] > maxY)
                                        {
                                            maxY = territoryData[i].geometry[j][2*k+1];
                                        }
                                        if (territoryData[i].geometry[j][2*k+1] < minY)
                                        {
                                            minY = territoryData[i].geometry[j][2*k+1];
                                        }
                                    }

                                }

                                maxXs.push(maxX);
                                maxYs.push(maxY);
                                minXs.push(minX);
                                minYs.push(minY);

                            }


                            for (var i = 0; i < maxXs.length; i++)
                            {
                                console.log("territory" + (i+1) + " : minX=" + minXs[i] + " ; maxX=" + maxXs[i] + " ; " + "minY=" + minYs[i] + " ; " + "maxY=" + maxYs[i]);
                                console.log("territory" + (i+1) + " : X = [" + minXs[i] + ", " + maxXs[i] + "] ; Y = [" + minYs[i] + ", " + maxYs[i] + "]");
                                console.log("territory" + (i+1) + " : X = [" + (minXs[i] - minXs[i]) + ", " + (maxXs[i] - minXs[i]) + "] ; Y = [" + (minYs[i] - minYs[i]) + ", " + (maxYs[i] - minYs[i]) + "]");
                            }

                            for (var i = 0; i < territoryData[0].geometry.length; i++)
                            {
                                for (var j = 0; j < territoryData[0].geometry[i].length / 2; j++)
                                {
                                    console.log("X = " + (territoryData[0].geometry[i][2*j] - minXs[0]) + " ; Y = " + (territoryData[0].geometry[i][2*j+1] - minYs[0]));
                                }
                            }

                            // FIN DES TESTS












                            // Send the data to the service
                            geometryBuilder.setTerritoryData(territoryData);

                            // Set extrudeSettings
                            geometryBuilder.setExtrudeSettings(extrudeSettings);


                            // Get the territory geometries
                            territoryGeometries = geometryBuilder.getTerritories();

                            // Iterate on each territory geometry and create the corresponding mesh
                            for (var i = 0; i < territoryGeometries.length; i++)
                            {
                                var territoryMesh = new THREE.Mesh(territoryGeometries[i], territoryMaterial);
                                territoryMeshes.push(territoryMesh);
                            }


                            // Get the outline geometries
                            outlineGeometries = geometryBuilder.getOutlines();

                            // Iterate on each outline geometry and create the corresponding mesh
                            for (var i = 0; i < outlineGeometries.length; i++)
                            {
                                var outlineMesh = new THREE.Mesh(outlineGeometries[i], outlineMaterial);
                                outlineMeshes.push(outlineMesh);
                            }


                            // Get the mountain outline geometries
                            mountainOutlineGeometries = geometryBuilder.getMountainOutlines();

                            // Iterate on each mountain outline geometry and create the corresponding mesh
                            for (var i = 0; i < mountainOutlineGeometries.length; i++)
                            {
                                var mountainOutlineMesh = new THREE.Mesh(mountainOutlineGeometries[i], mountainOutlineMaterial);
                                mountainOutlineMeshes.push(mountainOutlineMesh);
                            }


                            // Fill an array of nation indexes to help to determine which frontier geometry goes with which nation
                            var nationIdx = [];
                            for (var i = 0; i < territoryData.length; i++)
                            {
                                if (territoryData[i].hasOwnProperty("frontier"))
                                {
                                    switch (territoryData[i].nation)
                                    {
                                        case "Dwarves":
                                            nationIdx.push(0);
                                            break;
                                        case "Elves":
                                            nationIdx.push(1);
                                            break;
                                        case "Gondor":
                                            nationIdx.push(2);
                                            break;
                                        case "Isengard":
                                            nationIdx.push(3);
                                            break;
                                        case "North":
                                            nationIdx.push(4);
                                            break;
                                        case "Rohan":
                                            nationIdx.push(5);
                                            break;
                                        case "Sauron":
                                            nationIdx.push(6);
                                            break;
                                        case "Easterlings":
                                            nationIdx.push(7);
                                            break;
                                        default:
                                            nationIdx.push(8).
                                            console.log("Bad news ! No nation found.");
                                            break;
                                    }
                                }
                            }

                            // Get the frontier geometries
                            frontierGeometries = geometryBuilder.getFrontiers();

                            // Iterate on each frontier geometry and create the corresponding mesh
                            for (var i = 0; i < frontierGeometries.length; i++)
                            {
                                var frontierMesh = new THREE.Mesh(frontierGeometries[i], frontierMaterial[nationIdx[i]]);
                                frontierMeshes.push(frontierMesh);
                            }


                            // Create a group for each territory, binding it to its geometry, outline, mountain outline and frontier
                            var outlineCount = 0, mountainCount = 0, frontierCount = 0;

                            for (var i = 0; i < territoryData.length; i++)
                            {
                                var group = new THREE.Group();

                                group.add(territoryMeshes[i]);

                                if (territoryData[i].hasOwnProperty('outline'))
                                {
                                    group.add(outlineMeshes[outlineCount]);
                                    outlineCount++;
                                }

                                if (territoryData[i].hasOwnProperty('mountain'))
                                {
                                    group.add(mountainOutlineMeshes[mountainCount]);
                                    mountainCount++;
                                }

                                if (territoryData[i].hasOwnProperty('frontier'))
                                {
                                    group.add(frontierMeshes[frontierCount]);
                                    frontierCount++;
                                }

                                territories.push(group);
                            }

                            // Add territories to the scene
                            for (var i = 0; i < territories.length; i++)
                            {
                                scene.add(territories[i]);
                            }

                        });


                        // Get the shaders
                        scope.shaderPromise.then(function(shaders)
                        {
                            // Get and set the vertex and fragment shaders for the mountain material
                            mountainMaterial.vertexShader = shaders[0];
                            mountainMaterial.fragmentShader = shaders[1];
                            mountainMaterial.needsUpdate = true;

                            // Get and set the vertex and fragment shaders for the background material
                            backgroundMaterial.vertexShader = shaders[2];
                            backgroundMaterial.fragmentShader = shaders[3];
                            backgroundMaterial.needsUpdate = true;

                        });


                        // Get the textures
                        scope.texturePromise.then(function(textures) {

                            // Get and set territory texture
                            frontTerritoryTexture = textures[0];
                            initTexture(frontTerritoryTexture, THREE.RepeatWrapping, 1/1000, 1/680, 0.492, 0.501);
                            
                            // Get and set the dirt texture
                            var dirtTexture = textures[1];
                            initTexture(dirtTexture, THREE.RepeatWrapping, 10.0, 10.0, 0.0, 0.0);

                            // Get and set the sand texture
                            var sandTexture = textures[2];
                            initTexture(sandTexture, THREE.RepeatWrapping, 10.0, 10.0, 0.0, 0.0);

                            // Get and set the grass texture
                            var grassTexture = textures[3];
                            initTexture(grassTexture, THREE.RepeatWrapping, 10.0, 10.0, 0.0, 0.0);

                            // Get and set the rock texture
                            var rockTexture = textures[4];
                            initTexture(rockTexture, THREE.RepeatWrapping, 10.0, 10.0, 0.0, 0.0);

                            // Get and set the snow texture
                            var snowTexture = textures[5];
                            initTexture(snowTexture, THREE.RepeatWrapping, 10.0, 10.0, 0.0, 0.0);

                            // Get and set the heightmap for the mountains
                            var mountainHeightmap1 = textures[6];
                            initTexture(mountainHeightmap1, THREE.ClampToEdgeWrapping);

                            // Get and set the ocean texture
                            var oceanTexture = textures[7];
                            initTexture(oceanTexture, THREE.RepeatWrapping, 1.0, 1.0, 0.0, 0.0);

                            // Get and set the noise texture
                            var noiseTexture = textures[8];
                            initTexture(noiseTexture, THREE.RepeatWrapping, 1.0, 1.0, 0.0, 0.0);

                            // Get and set the depthmap for the ocean
                            var oceanDepthmapTexture = textures[9];
                            initTexture(oceanDepthmapTexture, THREE.ClampToEdgeWrapping);


                            // Assign the textures to their materials
                            //backgroundMaterial.map = waterTexture;
                            //backgroundMaterial.needsUpdate = true;               // Not necessary

                            frontTerritoryMaterial.map = frontTerritoryTexture;
                            frontTerritoryMaterial.needsUpdate = true;      // Not necessary

                            mountainUniforms.dirtTexture.value = dirtTexture;
                            mountainUniforms.sandTexture.value = sandTexture;
                            mountainUniforms.grassTexture.value = grassTexture;
                            mountainUniforms.rockTexture.value = rockTexture;
                            mountainUniforms.snowTexture.value = snowTexture;
                            mountainUniforms.bumpTexture.value = mountainHeightmap1;

                            backgroundUniforms.baseTexture.value = oceanTexture;
                            backgroundUniforms.noiseTexture.value = noiseTexture;
                            backgroundUniforms.dirtTexture.value = dirtTexture;
                            backgroundUniforms.depthmap.value = oceanDepthmapTexture;

                        });


                        // Finally animate the scene
                        animate();
  

                        // Resize the renderer on window resize
                        function onWindowResize(event) {
                            renderer.setSize(window.innerWidth, window.innerHeight);
                            camera.aspect = window.innerWidth / window.innerHeight;
                            camera.updateProjectionMatrix();
                        }


                        // Function that's called each frame to render
                        function animate() {
                            requestAnimationFrame(animate);
                            render();
                            update();
                        }


                        // Update the controls and anything else you want to update in runtime
                        function update()
                        {


                            // TESTS Sending time to shaders

                            var delta = clock.getDelta();
                            backgroundUniforms.time.value += delta;

                            // FIN DES TESTS




                            controls.update();
                        }


                        // Render the current state of the scene through the current camera
                        function render()
                        {
                            renderer.render(scene, camera);
                        }


                        // Update territory texture when another texture is picked by the user
                        scope.$watch('mountainBumpScaleValue', function(newValue, oldValue, scope) {
                            if (newValue !== oldValue)
                            {
                                mountainUniforms.bumpScale.value = newValue;
                            }
                        });

                        // Update water texture when another texture is picked by the user
                        scope.$watch('oceanTextureChoice', function(newValue, oldValue, scope) {
                            if (newValue !== oldValue)
                            {
                                textureLoader.getTexture(newValue).then(function(texture) {
                                    var oceanTexture = texture;
                                    initTexture(oceanTexture, THREE.RepeatWrapping, 1.0, 1.0, 0.0, 0.0);
                                    backgroundUniforms.baseTexture.value = oceanTexture;
                                    //waterTexture = texture;
                                    //initTexture(waterTexture, THREE.ClampToEdgeWrapping);
                                    //backgroundMaterial.map = waterTexture;
                                    //backgroundMaterial.needsUpdate = true;
                                });
                            }
                        });

                        // Update territory texture when another texture is picked by the user
                        scope.$watch('landTextureChoice', function(newValue, oldValue, scope) {
                            if (newValue !== oldValue)
                            {
                                textureLoader.getTexture(newValue).then(function(texture) {
                                    frontTerritoryTexture = texture;
                                    //initTexture(frontTerritoryTexture, THREE.RepeatWrapping, 1/1000, 1/680, 0.492, 0.501);
                                    initTexture(frontTerritoryTexture, THREE.RepeatWrapping, 1/10, 1/6.8, 0.0, 0.0);
                                    frontTerritoryMaterial.map = frontTerritoryTexture;
                                    frontTerritoryMaterial.needsUpdate = true;
                                });
                            }
                        });

                        // Initialize the wrapping mode of a texture
                        function initTexture(texture, mode, repeatU, repeatV, offsetU, offsetV) {
                            switch(mode)
                            {
                                case THREE.ClampToEdgeWrapping:
                                    texture.wrapS = texture.wrapT = mode;
                                    texture.repeat.set(1,1);
                                    texture.offset.set(0,0);
                                    break;
                                case THREE.RepeatWrapping:
                                    texture.wrapS = texture.wrapT = mode;
                                    texture.repeat.set(repeatU, repeatV);
                                    texture.offset.set(offsetU, offsetV);
                                    break;
                                case THREE.MirroredRepeatWrapping:
                                    // Not implemented yet, current wrapping mode will remain
                                    break;
                                default:
                                    // Unexisting wrapping mode, current wrapping mode will remain
                                    console.log("Warning : Attempt to initalize a texture with an unexisting wrapping mode.");
                                    break;
                            }
                        }
                    }
                }
            }
        ]
    );