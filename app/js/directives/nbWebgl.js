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
            'settlementBuilder',
            function (textureLoader, geometryBuilder, settlementBuilder)
            {
                return {

                    // Directive has to be used as an attribute
                    restrict: "A",          // When used as an element, pan doesn't work as it should, so use it as an attribute

                    // Create an isolate scope for this directive
                    scope: {
                        'landscapeParameters': '=landscapeParameters',  // Pay attention to the FUCKING NORMALIZATION : some-thing becomes someThing !
                        'territoryParameters': '=territoryParameters'   // 'isolateProperty': '=normalizedProperty' and in the DOM future-normalized-property="parentProperty"
                    },

                    // This isolate scope will use its own controller
                    controller: function($scope, $document, $timeout, territoryLoader, textureLoader, shaderLoader)
                    {

                        // Initialize variables to handle texture loading
                        $scope.landscapeTextureIndices = {};
                        $scope.territoryTextureIndices = {};
                        var landscapeTextures = [];
                        var territoryTextures = [];

                        // Gather landscape texture names and store their indices with their key strings
                        Object.keys($scope.landscapeParameters["textures"]).forEach(function(key, index) {
                            landscapeTextures.push(this[key].path);
                            $scope.landscapeTextureIndices[key] = index;
                        }, $scope.landscapeParameters["textures"]);

                        // Gather territory texture names and store their indices with their key strings
                        Object.keys($scope.territoryParameters["textures"]).forEach(function(key, index) {
                            territoryTextures.push(this[key].path);
                            $scope.territoryTextureIndices[key] = index;
                        }, $scope.territoryParameters["textures"]);


                        // Load landscape textures and get a promise to use it right after it has been loaded
                        $scope.landscapeTexturePromise = textureLoader.getTextures(landscapeTextures);
                        
                        // Load territory textures and get a promise to use it right after it has been loaded
                        $scope.territoryTexturePromise = textureLoader.getTextures(territoryTextures);

                        // Load territory data and get a promise to use it right after it has been loaded
                        $scope.territoryPromise = territoryLoader.getTerritories();

                        // Load shaders ang get a promise to use it right after it has been loaded
                        $scope.shaderPromise = shaderLoader.getShaders(["vertex_shader", "fragment_shader", "vertex_shader_water", "fragment_shader_water", "vertex_shader_landscape", "fragment_shader_landscape"]);

                        
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
                            camera.position.set(0, 0, 100);
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
                            //controls.target = new THREE.Vector3(0, 0, 500);

                        }


                        // GEOMETRY AND TEXTURES, USE PROMISES


                        // Initialize basic ambient and directional lights
                        scene.add(new THREE.AmbientLight(0xffffff));
                        var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
                        directionalLight.position.x = 1;
                        directionalLight.position.y = 1;
                        directionalLight.position.z = 1;
                        directionalLight.position.normalize();
                        scene.add(directionalLight);
                        directionalLight = directionalLight.clone();
                        directionalLight.position.x = -1;
                        directionalLight.position.y = 1;
                        directionalLight.position.z = 1;
                        directionalLight.position.normalize();
                        scene.add(directionalLight);


                        // Create the border mesh
                        var borderGeometry = geometryBuilder.getBorders();
                        var borderMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
                        var borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
                        scene.add(borderMesh);


                        // Create the landscape mesh
                        var landscapeGeometry = new THREE.PlaneGeometry(1000, 680, 511, 255);
                        var landscapeUniforms = {
                            bumpTexture:    { type: "t" },
                            snowTexture:    { type: "t" },
                            rockTexture:    { type: "t" },
                            forestTexture:  { type: "t" },
                            trunkTexture:   { type: "t" },
                            waterTexture:   { type: "t" },
                            dirtTexture:    { type: "t" },
                            noiseTexture:   { type: "t" },
                            waterUV: {
                                type: "v2",
                                value: new THREE.Vector2(
                                    scope.landscapeParameters['textures']['water'].u,
                                    scope.landscapeParameters['textures']['water'].v
                                )},
                            snowUV: {
                                type: "v2",
                                value: new THREE.Vector2(
                                    scope.landscapeParameters['textures']['snow'].u,
                                    scope.landscapeParameters['textures']['snow'].v
                                )},
                            rockUV: {
                                type: "v2",
                                value: new THREE.Vector2(
                                    scope.landscapeParameters['textures']['rock'].u,
                                    scope.landscapeParameters['textures']['rock'].v
                                )},
                            dirtUV: {
                                type: "v2",
                                value: new THREE.Vector2(
                                    scope.landscapeParameters['textures']['dirt'].u,
                                    scope.landscapeParameters['textures']['dirt'].v
                                )},
                            forestUV: {
                                type: "v2",
                                value: new THREE.Vector2(
                                    scope.landscapeParameters['textures']['forest'].u,
                                    scope.landscapeParameters['textures']['forest'].v
                                )},
                            trunkUV: {
                                type: "v2",
                                value: new THREE.Vector2(
                                    scope.landscapeParameters['textures']['trunk'].u,
                                    scope.landscapeParameters['textures']['trunk'].v
                                )},
                            noiseUV: {
                                type: "v2",
                                value: new THREE.Vector2(
                                    scope.landscapeParameters['textures']['noise'].u,
                                    scope.landscapeParameters['textures']['noise'].v
                                )},
                            baseSpeed:  { type: "f", value: scope.landscapeParameters['floats']['baseSpeed']    },
                            noiseScale: { type: "f", value: scope.landscapeParameters['floats']['noiseScale']   },
                            alpha:      { type: "f", value: scope.landscapeParameters['floats']['alpha']        },
                            bumpScale:  { type: "f", value: scope.landscapeParameters['floats']['bumpScale']    },
                            time:       { type: "f", value: 1.0 }
                        };
                        var landscapeMaterial = new THREE.ShaderMaterial({
                            uniforms: landscapeUniforms,
                            wireframe: false
                        });
                        var landscapeMesh = new THREE.Mesh(landscapeGeometry, landscapeMaterial);
                        scene.add(landscapeMesh);
                        

                        // Test Helm's Deep

                        var helmsDeepGeometry = geometryBuilder.getHelmsDeep();
                        helmsDeepGeometry.mergeVertices();
                        helmsDeepGeometry.computeFaceNormals();
                        helmsDeepGeometry.computeVertexNormals();
                        var tex = new THREE.TextureLoader().load('resources/textures/rock-wall.jpg');
                        var helmsDeepMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, map: tex });
                        var helmsDeepMesh = new THREE.Mesh(helmsDeepGeometry, helmsDeepMaterial);
                        scene.add(helmsDeepMesh);
                        helmsDeepMesh.rotateX(Math.PI/2);
                        helmsDeepMesh.rotateY(3*Math.PI/4);
                        helmsDeepMesh.position.z = 12.5;
                        helmsDeepMesh.position.y = -10;
                        helmsDeepMesh.position.x = -10;
                        helmsDeepMesh.scale.set(20.0, 20.0, 20.0);


                        var normal = new THREE.FaceNormalsHelper(helmsDeepMesh);
                        //scene.add(normal);
                        var wireframe = new THREE.WireframeHelper( helmsDeepMesh, 0x00ff00 );
                        //scene.add(wireframe);

                        console.log(helmsDeepMesh.geometry.vertices.length);

                        var testG = settlementBuilder.getHelmsDeep();
                        testG.mergeVertices();
                        testG.computeFaceNormals();
                        testG.computeVertexNormals();
                        var testM = new THREE.Mesh(testG, helmsDeepMaterial);
                        scene.add(testM);
                        testM.rotateX(Math.PI/2);
                        testM.rotateY(3*Math.PI/4);
                        testM.position.z = 30;
                        testM.position.y = -10;
                        testM.position.x = -10;
                        testM.scale.set(20.0, 20.0, 20.0);

                        normal = new THREE.FaceNormalsHelper(testM);
                        scene.add(normal);
                        wireframe = new THREE.WireframeHelper(testM, 0x00ff00 );
                        scene.add(wireframe);

                        console.log("NUMBER OF VERTICES : " + testG.vertices.length);
                        console.log("NUMBER OF FACES : " + testG.faces.length);

                        // Big Wall
                        /*var helmGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.05);
                        var textureLoader = new THREE.TextureLoader();
                        textureLoader.load('resources/textures/rock-wall.jpg', function(texture) {
                            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                            var frontTexture = texture.clone();
                            frontTexture.needsUpdate = true;
                            var sideTexture = texture.clone();
                            sideTexture.needsUpdate = true;
                            var topTexture = texture.clone();
                            topTexture.needsUpdate = true;

                            frontTexture.repeat.set(5.0, 2.0);
                            sideTexture.repeat.set(1.0, 2.0);
                            topTexture.repeat.set(5.0, 1.0);

                            var helmMaterials = [
                                new THREE.MeshPhongMaterial({ map: sideTexture }),
                                new THREE.MeshPhongMaterial({ map: sideTexture }),
                                new THREE.MeshPhongMaterial({ map: topTexture }),
                                new THREE.MeshPhongMaterial({ map: topTexture }),
                                new THREE.MeshPhongMaterial({ map: frontTexture }),
                                new THREE.MeshPhongMaterial({ map: frontTexture })
                            ];

                            var helmMaterial = new THREE.MeshFaceMaterial(helmMaterials);
                            var helmMesh = new THREE.Mesh(helmGeometry, helmMaterial);
                            //scene.add(helmMesh);
                            //helmMesh.position.z = 600;
                            //helmMesh.scale.set(250.0, 250.0, 250.0);

                            var helm1_bsp = new ThreeBSP(helmMesh);

                            helmGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 18, 1, false, 1.57, 3.14);
                            helmMaterial = new THREE.MeshPhongMaterial();
                            helmMesh = new THREE.Mesh(helmGeometry, helmMaterial);
                            //scene.add(helmMesh);
                            //helmMesh.position.z = 600;
                            helmMesh.translateY(-0.1);
                            helmMesh.rotateX(THREE.Math.degToRad(90));
                            //helmMesh.scale.set(250.0, 250.0, 250.0);

                            var helm2_bsp = new ThreeBSP(helmMesh);
                            var result = helm1_bsp.subtract(helm2_bsp).toMesh(new THREE.MeshPhongMaterial());
                            scene.add(result);
                            result.position.z = 600;
                            result.scale.set(250.0, 250.0, 250.0);

                            helmGeometry = new THREE.BoxGeometry()
                        });
*/
                        /*
                        wall_texture.wrapS = wall_texture.wrapT = THREE.RepeatWrapping;
                        var frontTexture = wall_texture.clone();
                        wall_texture.needsUpdate = true;
                        frontTexture.repeat.set(5.0, 2.0);
                        var sideTexture = wall_texture;
                        sideTexture.repeat.set(1.0, 2.0);
                        var topTexture = wall_texture;
                        topTexture.repeat.set(1.0, 5.0);*//*
                        var helmMaterials = [
                            new THREE.MeshPhongMaterial({ map: frontTexture }),
                            new THREE.MeshPhongMaterial({ map: sideTexture }),
                            new THREE.MeshPhongMaterial({ map: topTexture }),
                            new THREE.MeshPhongMaterial({ map: topTexture }),
                            new THREE.MeshPhongMaterial({ map: sideTexture }),
                            new THREE.MeshPhongMaterial({ map: frontTexture })
                        ];
                        var helmMaterial = new THREE.MeshFaceMaterial(helmMaterials);
                        //var helmMaterial = new THREE.MeshPhongMaterial();
                        var helmMesh = new THREE.Mesh(helmGeometry, helmMaterial);
                        scene.add(helmMesh);
                        helmMesh.position.z = 600;
                        helmMesh.scale.set(250.0, 250.0, 250.0);
*/
                        /*
                        var helm1Geometry = new THREE.BoxGeometry(0.6, 0.2, 0.05);
                        var helm1_bsp = new ThreeBSP( helm1Geometry );
                        var helm2Geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 18, 1, false, 1.57, 3.14);
                        helm2Geometry.rotateX(THREE.Math.degToRad(90));
                        helm2Geometry.translate(0, -0.1, 0);
                        var helm2_bsp = new ThreeBSP( helm2Geometry );
                        var result = helm1_bsp.subtract(helm2_bsp);
                        //result = result.toMesh(new THREE.MeshPhongMaterial());
                        var textureLoader = new THREE.TextureLoader();
                        var texture = textureLoader.load('resources/textures/rock-wall.jpg');
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(5.0, 2.0);
                        result = new THREE.Mesh(result.toGeometry(), new THREE.MeshPhongMaterial({ map: texture }));
                        scene.add(result);
                        result.position.z = 600;
                        result.scale.set(250.0, 250.0, 250.0);

                        var wireframe = new THREE.WireframeHelper( result, 0x00ff00 );
                        scene.add(wireframe);

                        var options = {
                            curveSegments: 1,
                            steps: 1,
                            amount: 0.01,
                            bevelEnabled: true,
                            bevelThickness: 0.002,
                            bevelSize: 0.002,
                            bevelSegments: 1,
                            material: 0,
                            extrudeMaterial: 1
                        };
                        var points = [
                            new THREE.Vector2(0.0, 0.0),
                            new THREE.Vector2(0.0, 0.005),
                            new THREE.Vector2(0.02, 0.005),
                            new THREE.Vector2(0.02, 0.0),
                            new THREE.Vector2(0.0, 0.0)
                        ];
                        var shapes = new THREE.Shape(points);
                        var helm3Geometry = new THREE.ExtrudeGeometry(shapes, options);
                        var helmMaterial = new THREE.MeshPhongMaterial();
                        var helmMesh = new THREE.Mesh(helm3Geometry, helmMaterial);
                        helmMesh.rotateX(THREE.Math.degToRad(90));
                        helmMesh.position.z = 604.5;
                        helmMesh.scale.set(250.0, 250.0, 250.0);
                        helmMesh.translateZ(-27.5);
                        helmMesh.translateX(-74.5);
                        scene.add(helmMesh);

                        var group = new THREE.Group();
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        helmMesh = helmMesh.clone().translateX(10);
                        scene.add(helmMesh);
                        group.add(helmMesh);

                        wireframe = new THREE.WireframeHelper( helmMesh, 0x00ff00 );
                        scene.add(wireframe);

                        scene.add(group);
                        group.translateX(2);

                        helmMaterial.map = texture;
                        helmMaterial.needsUpdate = true;
*/
                        /*var helmGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.05);
                        var helmMaterial = new THREE.MeshPhongMaterial();
                        var helmMesh = new THREE.Mesh(helmGeometry, helmMaterial);
                        scene.add(helmMesh);
                        helmMesh.position.z = 600;
                        helmMesh.scale.x = 250.0;
                        helmMesh.scale.y = 250.0;
                        helmMesh.scale.z = 250.0;

                        var helm1_bsp = new ThreeBSP( helmMesh );

                        var helmGeometry2 = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 18, 1, false, 1.57, 3.14);
                        var helmMesh2 = new THREE.Mesh(helmGeometry2, helmMaterial);
                        scene.add(helmMesh2);
                        helmMesh2.position.z = 600;
                        helmMesh2.position.y = -25;
                        helmMesh2.rotateX(THREE.Math.degToRad(90));
                        helmMesh2.scale.set(250.0, 250.0, 250.0);

                        var helm2_bsp = new ThreeBSP( helmMesh2 );

                        var subtract_bsp = helm1_bsp.subtract( helm2_bsp );
                        var result = subtract_bsp.toMesh( new THREE.MeshPhongMaterial() );
                        scene.add(result);
                        result.translateZ(50);*/
/*
                        var cube_geometry = new THREE.CubeGeometry( 3, 3, 3 );
                        var cube_mesh = new THREE.Mesh( cube_geometry );
                        cube_mesh.position.x = -7;
                        var cube_bsp = new ThreeBSP( cube_mesh );
                        var sphere_geometry = new THREE.SphereGeometry( 1.8, 32, 32 );
                        var sphere_mesh = new THREE.Mesh( sphere_geometry );
                        sphere_mesh.position.x = -7;
                        var sphere_bsp = new ThreeBSP( sphere_mesh );

                        var subtract_bsp = cube_bsp.subtract( sphere_bsp );
                        var result = subtract_bsp.toMesh( new THREE.MeshPhongMaterial() );
                        result.geometry.computeVertexNormals();
                        scene.add( result );
                        var edges = new THREE.VertexNormalsHelper( result, 2, 0x00ff00, 1 );
                        scene.add( edges );*/
/*
                        // Big Wall
                        var wallGeometry = new THREE.BoxGeometry(200, 50, 20);
                        var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
                        var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
                        scene.add(wallMesh);
                        wallMesh.position.z = 500;
                        // Tower
                        var tower1Geometry = new THREE.BoxGeometry(10, 125, 1);
                        var tower1Material = new THREE.MeshPhongMaterial({ color: 0x333333 });
                        var tower1Mesh = new THREE.Mesh(tower1Geometry, tower1Material);
                        scene.add(tower1Mesh);
                        tower1Mesh.position.z = 500;
                        tower1Mesh.translateX(100);
                        tower1Mesh.translateY(50);
                        tower1Mesh.translateZ(-10);
                        tower1Mesh.rotateY(THREE.Math.degToRad(45));
                        var tower2Mesh = tower1Mesh.clone();
                        scene.add(tower2Mesh);
                        tower2Mesh.rotateY(THREE.Math.degToRad(90));
                        // Bridge
                        // Doors
                        // First stage
                        var firstStageGeometry = new THREE.CylinderGeometry(50, 50, 50, 10, 1);
                        var firstStageMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
                        var firstStageMesh = new THREE.Mesh(firstStageGeometry, firstStageMaterial);
                        scene.add(firstStageMesh);
                        firstStageMesh.position.z = 500;
                        firstStageMesh.translateX(150);
                        // Second stage
                        var secondStageGeometry = new THREE.CylinderGeometry(30, 30, 75, 10, 1);
                        var secondStageMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
                        var secondStageMesh = new THREE.Mesh(secondStageGeometry, secondStageMaterial);
                        scene.add(secondStageMesh);
                        secondStageMesh.position.z = 500;
                        secondStageMesh.translateX(150);
                        secondStageMesh.translateY(12.5);
                        // Entry of caverns
                        var wallGeometry = new THREE.BoxGeometry(200, 50, 20);
                        var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
                        var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
                        scene.add(wallMesh);
                        wallMesh.position.z = 500;
*/
                        // Initialize geometry and material for the territory meshes
                        var territoryGeometries = [];
                        var frontTerritoryMaterial = new THREE.MeshPhongMaterial();
                        var backTerritoryMaterial = new THREE.MeshPhongMaterial({ visible: false });
                        var sideTerritoryMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
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
                        var mountainGeometry = new THREE.PlaneGeometry(365, 235, 73, 47);
                        var mountainUniforms = {
                            bumpTexture: { type: "t"/*, value: mountainBumpTexture*/ },
                            bumpScale: { type: "f", value: scope.territoryParameters['floats']['bumpScale'] },
                            dirtTexture: { type: "t"/*, value: dirtTexture*/ },
                            //sandTexture: { type: "t"/*, value: sandTexture*/ },
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

                            // Get and set the vertex and fragment shaders for the landscape material
                            landscapeMaterial.vertexShader = shaders[4];
                            landscapeMaterial.fragmentShader = shaders[5];
                            landscapeMaterial.needsUpdate = true;

                        });

                        // Get the landscape textures
                        scope.landscapeTexturePromise.then(function(textures) {

                            // Iterate on each landscape texture
                            Object.keys(scope.landscapeTextureIndices).forEach(function(key, index) {

                                // By default, set wrapping mode to repeat...
                                textures[this[key]].wrapS = textures[this[key]].wrapT = THREE.RepeatWrapping;

                                // ...Except for the bump texture
                                if (key === "bump")
                                {
                                    textures[this[key]].wrapS = textures[this[key]].wrapT = THREE.ClampToEdgeWrapping;
                                }

                                // Update landscape uniforms with the texture
                                landscapeUniforms[key + "Texture"].value = textures[this[key]];

                            }, scope.landscapeTextureIndices);

                            // Why not ?
                            landscapeMaterial.needsUpdate = true;

                            mountainUniforms.dirtTexture.value = textures[3];
                            //mountainUniforms.sandTexture.value = sandTexture;
                            //mountainUniforms.grassTexture.value = grassTexture;
                            mountainUniforms.rockTexture.value = textures[2];
                            mountainUniforms.snowTexture.value = textures[1];
                        });

                        // Get the territory textures
                        scope.territoryTexturePromise.then(function(textures) {

                            // Iterate on territory texture
                            Object.keys(scope.territoryTextureIndices).forEach(function(key, index) {

                                if (key === "land")
                                {
                                    textures[this[key]].wrapS = textures[this[key]].wrapT = THREE.RepeatWrapping;
                                    textures[this[key]].repeat.set(1, 1/0.68);
                                }

                                //territoryUniforms[key + "Texture"].value = textures[this[key]];
                            }, scope.territoryTextureIndices);

                            //textures[0].wrapS = textures[0].wrapT = THREE.RepeatWrapping;
                            //textures[0].repeat.set(1, 1/0.68);

                            frontTerritoryMaterial.map = textures[0];
                            frontTerritoryMaterial.needsUpdate = true;

                            mountainUniforms.bumpTexture.value = textures[1];

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
                            // Send time to shaders
                            var delta = clock.getDelta();
                            landscapeUniforms.time.value += delta;
                            landscapeMaterial.needsUpdate = true;

                            // Move
                            controls.update();
                        }


                        // Render the current state of the scene through the current camera
                        function render()
                        {
                            renderer.render(scene, camera);
                        }


                        // Update landscape uniforms whenever a parameter is changed by the user
                        scope.$watch('landscapeParameters', function(newValue, oldValue, scope) {

                            // Iterate on each key of the landscape parameters
                            Object.keys(newValue).forEach(function(k, i) {

                                switch(k) {

                                    case 'textures':
                                        // Iterate on each texture
                                        Object.keys(newValue[k]).forEach(function(key, index) {

                                            // Check if the path value has changed
                                            if (newValue[k][key].path !== oldValue[k][key].path)
                                            {
                                                // Load new texture and update uniforms
                                                textureLoader.getTexture(newValue[k][key].path).then(function (texture) {
                                                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                                                    landscapeUniforms[key + 'Texture'].value = texture;
                                                });
                                            }

                                            // Check if the u value has changed
                                            if (newValue[k][key].u !== oldValue[k][key].u)
                                            {
                                                // Update uniforms
                                                landscapeUniforms[key + 'UV'].value.x = newValue[k][key].u;
                                            }

                                            // Check if the v value has changed
                                            if (newValue[k][key].v != oldValue[k][key].v)
                                            {
                                                // Update uniforms
                                                landscapeUniforms[key + 'UV'].value.y = newValue[k][key].v;
                                            }

                                        });
                                        break;

                                    case 'floats':
                                        // Iterate on each float
                                        Object.keys(newValue[k]).forEach(function(key, index) {

                                            // Check if the value has changed
                                            if (newValue[k][key] !== oldValue[k][key])
                                            {
                                                // Update uniforms
                                                landscapeUniforms[key].value = newValue[k][key];
                                            }

                                        });
                                        break;

                                    default:
                                        console.log("Unknown key detected in landscapeParameters !");
                                        break;
                                }

                            });

                            // Why not ?
                            landscapeMaterial.needsUpdate = true;

                        }, true);   // true means deep watch !


                        // Update territory uniforms whenever a parameter is changed by the user
                        scope.$watch('territoryParameters', function(newValue, oldValue, scope) {

                            // Iterate on each key of the landscape parameters
                            Object.keys(newValue).forEach(function(k, i) {

                                switch (k) {

                                    case 'textures':
                                        // Iterate on each texture
                                        Object.keys(newValue[k]).forEach(function (key, index) {

                                            // Check if the path value has changed
                                            if (newValue[k][key].path !== oldValue[k][key].path)
                                            {
                                                // Load the texture and update uniforms
                                                textureLoader.getTexture(newValue[k][key].path).then(function (texture) {
                                                    if (key === "land")
                                                    {
                                                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                                                        texture.repeat.set(1/10, 1/6.8);
                                                        frontTerritoryMaterial.map = texture;
                                                        frontTerritoryMaterial.needsUpdate = true;
                                                    }
                                                    else
                                                    {
                                                        mountainUniforms[key + 'Texture'].value = texture;
                                                    }

                                                    //texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                                                    //territoryUniforms[key + 'Texture'].value = texture;

                                                });
                                            }

                                            // Check if the u value has changed
                                            if (newValue[k][key].u !== oldValue[k][key].u)
                                            {
                                                //Update uniforms
                                                frontTerritoryMaterial.map.repeat.set(1/newValue[k][key].u, 1/newValue[k][key].v);
                                                //territoryUniforms[key + 'UV'].value.x = newValue[k][key].u;
                                            }

                                            // Check if the v value has changed
                                            if (newValue[k][key].v != oldValue[k][key].v)
                                            {
                                                //Update uniforms
                                                frontTerritoryMaterial.map.repeat.set(1/newValue[k][key].u, 1/newValue[k][key].v);
                                                //territoryUniforms[key + 'UV'].value.y = newValue[k][key].v;
                                            }
                                        });
                                        break;

                                    case 'floats':
                                        // Iterate on each float
                                        // Check if the value has changed
                                        // Blablabla todo
                                        if (newValue[k]['bumpScale'] !== oldValue[k]['bumpScale'])
                                        {
                                            mountainUniforms.bumpScale.value = newValue[k]['bumpScale'];
                                        }
                                        break;

                                    default:
                                        console.log("Unknown key detected in territoryParameters !");
                                        break;
                                }

                            });

                            // Why not ?
                            territoryMaterial.needsUpdate = true;

                        }, true);   // true means deep watch !
                        
                    }
                }
            }
        ]
    );