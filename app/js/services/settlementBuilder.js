/**
 * Created by Nicolas Buecher on 30/05/2016.
 */

'use strict';

/**
 * Service settlementBuilder
 *
 * Create and return meshes for the standard settlements and the main strongholds
 */
angular.module('WarOfTheRingApp')
    .factory('settlementBuilder', function()
    {
        return {

            getSettlement: function(type, which, width, height, depth)
            {
                var settlement;

                switch(type)
                {
                    case 'fortification':
                        break;
                    case 'town':
                        break;
                    case 'city':
                        break;
                    case 'stronghold':
                        switch(which)
                        {
                            case 'Helms Deep':
                                break;
                            case 'Minas Thirith':
                                break;
                            default:
                                break;
                        }
                        break;
                    default:
                        break;
                }

                return settlement;
            },

            getTown: function(width, height, depth)
            {

            },

            getCity: function(width, height, depth)
            {

            },

            getFortification: function(width, height, depth)
            {

            },

            getHelmsDeep: function(width, height, depth)
            {

                // 1. Initialize the final geometry
                var helmsDeepGeometry = new THREE.Geometry();


                // 2. Initialize the temporary variables
                var box, box2, cylinder, cylinder2, plane, extrude, lathe;      // Single geometry
                var bspResult;                                                  // CSG geometry
                var lathePoints, extrudePoints, extrudeShape, extrudeOptions;   // Extrude and lathe geometry parameters
                var boxes, extrudes;                                            // Merged geometries
                var length;                                                     // Number of vertices of some geometries to manipulate them


                // 2. Create the big wall geometry
                var bigWallGeometry = new THREE.Geometry();

                // Wall
                box = new THREE.BoxGeometry(0.15, 0.2, 0.05);
                //bigWallGeometry.merge(box.translate(-0.425, -0.4, -0.2));
                box = new ThreeBSP(box.translate(-0.425, -0.4, -0.2));
                box2 = new THREE.BoxGeometry(0.05, 0.175, 0.05);
                //bigWallGeometry.merge(box2.translate(-0.325, -0.3875, -0.2));
                box2 = new ThreeBSP(box2.translate(-0.325, -0.3875, -0.2));
                bspResult = box.union(box2).toGeometry();
                bigWallGeometry.merge(bspResult);


/*
                box = new THREE.BoxGeometry(0.3, 0.2, 0.05);
                bigWallGeometry.merge(box.translate(-0.15, -0.4, -0.2));

                // Tunnel
                box = new THREE.BoxGeometry(0.05, 0.025, 0.05);
                box = new ThreeBSP(box.translate(-0.325, -0.4875, -0.2));
                cylinder = new THREE.CylinderGeometry(0.025, 0.025, 0.05, 4, 1, false, Math.PI/2, Math.PI);
                cylinder = new ThreeBSP(cylinder.rotateX(Math.PI/2).translate(-0.325, -0.5, -0.2));
                bspResult = box.subtract(cylinder).toGeometry();
                bigWallGeometry.merge(bspResult);

                cylinder = new THREE.CylinderGeometry(0.001, 0.001, 0.025, 6, 1, false);
                for (var i = 0; i < 9; i++)
                {
                    bigWallGeometry.merge(cylinder.clone().translate(-0.305 - (i*0.005), -0.4875, -0.2));
                }

                // End of the wall
                box = new THREE.BoxGeometry(0.1, 0.2, 0.05);
                box.vertices[0].y += 0.05;
                box.vertices[1].y += 0.05;
                bigWallGeometry.merge(box.translate(0.05, -0.4, -0.2));

                // Towers of the wall
                cylinder = new THREE.CylinderGeometry(0.025, 0.025, 0.225, 5, 1, false, -Math.PI/2, Math.PI);
                bigWallGeometry.merge(cylinder.translate(-0.025, -0.3875, -0.175));

                cylinder = new THREE.CylinderGeometry(0.025, 0.025, 0.225, 5, 1, false, Math.PI, Math.PI);
                cylinder = new ThreeBSP(cylinder.translate(0.1, -0.2375, -0.2));
                box = new THREE.BoxGeometry(0.025, 0.025, 0.015);
                box = new ThreeBSP(box.translate(0.0875, -0.25, -0.2));
                cylinder2 = new THREE.CylinderGeometry(0.0075, 0.0075, 0.025, 3, 1, false, 0, Math.PI);
                cylinder2 = new ThreeBSP(cylinder2.rotateZ(Math.PI/2).translate(0.0875, -0.2375, -0.2));
                bspResult = cylinder.subtract(box.union(cylinder2)).toGeometry();
                bigWallGeometry.merge(bspResult);

                // Close the back of towers
                plane = new THREE.PlaneGeometry(0.05, 0.025, 1, 1);
                bigWallGeometry.merge(plane.rotateY(Math.PI).translate(-0.025, -0.2875, -0.175));
                plane = new THREE.PlaneGeometry(0.05, 0.125, 1, 1);
                bigWallGeometry.merge(plane.rotateY(Math.PI/2).translate(0.1, -0.1875, -0.2));

                // Battlements of the wall
                extrudePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.045, 0.0),
                    new THREE.Vector2(0.045, 0.002),
                    new THREE.Vector2(0.0, 0.002),
                    new THREE.Vector2(0.0, 0.0)
                ];
                extrudeOptions = {
                    curveSegments: 1,
                    steps: 1,
                    amount: 0.01,
                    bevelEnabled: true,
                    bevelThickness: 0.01,
                    bevelSize: 0.0025,
                    bevelSegments: 1,
                    material: 0,
                    extrudeMaterial: 1
                };
                extrudeShape = new THREE.Shape(extrudePoints);
                extrude = new THREE.ExtrudeGeometry(extrudeShape, extrudeOptions);
                extrude.center();
                // X: pos   // Y: pos + amount/2    // Z: pos - depth/2 - 3*bevel/4
                // -0.475   // -0.3 + 0.005         // -0.175 - 0.001 - 0.001875
                extrude.rotateX(Math.PI/2).translate(-0.475, -0.295, -0.177875);
                for (var i = 0; i < 9; i++)
                {
                    bigWallGeometry.merge(extrude.clone().translate(i*0.05, 0.0, 0.0));
                }

                // Battlements of the end of the wall
                extrudePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.045, 0.0),
                    new THREE.Vector2(0.045, 0.002),
                    new THREE.Vector2(0.0, 0.002),
                    new THREE.Vector2(0.0, 0.0)
                ];
                extrudeOptions = {
                    curveSegments: 1,
                    steps: 1,
                    amount: 0.01,
                    bevelEnabled: true,
                    bevelThickness: 0.01,
                    bevelSize: 0.0025,
                    bevelSegments: 1,
                    material: 0,
                    extrudeMaterial: 1
                };
                extrudeShape = new THREE.Shape(extrudePoints);
                extrude = new THREE.ExtrudeGeometry(extrudeShape, extrudeOptions);
                extrude.center();
                extrude.rotateX(Math.PI/2);
                for (var i = 0; i < 4; i++)
                {
                    extrude.vertices[i*4+1].y += 0.025;
                    extrude.vertices[i*4+2].y += 0.025;
                }
                // X: pos   // Y: pos + amount/2    // Z: pos - depth/2 - 3*bevel/4
                // 0.025    // -0.3 + 0.005         // -0.175 - 0.001 - 0.001875
                bigWallGeometry.merge(extrude.clone().translate(0.025, -0.295, -0.177875));
                // 0.075    // -0.275 + 0.005       // -0.175 - 0.001 - 0.001875
                bigWallGeometry.merge(extrude.clone().translate(0.075, -0.27, -0.177875));

                // Battlements of the towers
                extrudePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.0125, 0.0),
                    new THREE.Vector2(0.0125, 0.002),
                    new THREE.Vector2(0.0, 0.002),
                    new THREE.Vector2(0.0, 0.0)
                ];
                extrudeOptions = {
                    curveSegments: 1,
                    steps: 1,
                    amount: 0.005,
                    bevelEnabled: true,
                    bevelThickness: 0.005,
                    bevelSize: 0.001475,
                    bevelSegments: 1,
                    material: 0,
                    extrudeMaterial: 1
                };
                extrudeShape = new THREE.Shape(extrudePoints);
                extrude = new THREE.ExtrudeGeometry(extrudeShape, extrudeOptions);
                extrude.center();
                // X: pos   // Y: pos + amount/2    // Z: pos - depth/2 - 3*bevel/4 - offset
                // 0.0      // 0.0 + 0.0025         // 0.025 - 0.001 - 0.00110625 - 0.001225
                extrude.rotateX(-Math.PI/2).translate(0.0, 0.0025, 0.02166875);
                extrudes = new THREE.Geometry();
                for (var i = 0; i < 5; i++)
                {
                    extrudes.merge(extrude.clone().rotateY(THREE.Math.degToRad(-72 + (i*36))));
                }
                bigWallGeometry.merge(extrudes.clone().translate(-0.025, -0.275, -0.175));
                bigWallGeometry.merge(extrudes.clone().rotateY(-Math.PI/2).translate(0.1, -0.125, -0.2));
*/
                // Adds the big wall geometry to the final geometry
                helmsDeepGeometry.merge(bigWallGeometry);

                // 8. Return the final geometry
                return helmsDeepGeometry;
            }

        }
    });