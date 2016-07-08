/**
 * Created by Nicolas Buecher on 10/04/2016.
 */

'use strict';

/**
 * Service geometryBuilder
 *
 * Create and return geometry and meshes
 */
angular.module('WarOfTheRingApp')
    .factory('geometryBuilder', function()
    {
        // var data = {}; function getData { return data["territoryData"]} ; territoryData = service.getData("territoryData") at the beginning of each function
        // Initialize an array to store the data to work with
        var territoryData = [];
        // Initialize a property to inform if the asked data has already been provided to the service
        var dataIsReady = false;
        // Initialize a property to contain the length of territoryData array
        var numberOfTerritories = 0;
        // Initialize a property to contain the extrudeSettings provided
        var extrudeSettings = {};


        // Compute and clamp vectors from JSON territory data into [-500, 500] and [-340, 340] ranges
        var computeVectors = function (coordinatesXY)
        {
            var vectors = [];
            var ratioY = 1415 / 680; // Compute it there to avoid computing it in each iteration

            // Iterate on each couple of coordinates (X,Y)
            for (var i = 0; i < coordinatesXY.length / 2; i++)
            {
                var vectorX = (coordinatesXY[2 * i] - 1035) / 2.07;
                var vectorY = (coordinatesXY[2 * i + 1] - 707.5) / ratioY;
                vectors.push(new THREE.Vector2(vectorX, vectorY));
            }

            // Return the array of 2D Vectors
            return vectors;
        };


        //geometryBuilder service :
        return {

            // Set the service properties with the data provided
            setTerritoryData: function(data)
            {
                territoryData = data;                       // Store data
                dataIsReady = true;                         // Inform tha data is loaded
                numberOfTerritories = territoryData.length; // Store the data length in a easy to understand property
            },

            // Set the extrude settings with the settings provided
            setExtrudeSettings: function(settings)
            {
                extrudeSettings = settings;
            },

            // Return a THREE.BoxGeometry object containing the merged geometries of the four borders
            getBorders: function()
            {

                // Create geometry
                var borderTopGeometry = new THREE.BoxGeometry(1020, 10, 50);
                var borderBottomGeometry = borderTopGeometry.clone();
                var borderLeftGeometry = new THREE.BoxGeometry(680, 10, 50);
                var borderRightGeometry = borderLeftGeometry.clone();

                // Move geometry in its local space
                borderTopGeometry.translate(0, 345, 0);
                borderBottomGeometry.translate(0, -345, 0);
                borderLeftGeometry.rotateZ(THREE.Math.degToRad(90)).translate(-505, 0, 0);
                borderRightGeometry.rotateZ(THREE.Math.degToRad(90)).translate(505, 0, 0);

                // Merge geometry
                borderLeftGeometry.merge(borderRightGeometry);
                borderBottomGeometry.merge(borderLeftGeometry);
                borderTopGeometry.merge(borderBottomGeometry);

                // Return the main merged geometry
                return borderTopGeometry;
                
            },

            // Return an array of THREE.ExtrudeGeometry objects containing the merged geometries of the 105 territories
            getTerritories: function()
            {

                // 1. Initialize the array of final territory geometries
                var territories = [];

                // 2. Check if territory data has already been sent to the service
                if (!dataIsReady) // !data.hasOwnProperty("territoryData") ?
                {
                    console.log("Warning : No territory data !");
                    return territories;
                }
                else
                {
                    // 3. Iterate on each territory object
                    for (var i = 0; i < numberOfTerritories; i++)
                    {
                        // 4. Check if the territory has an array of geometries
                        if (territoryData[i].hasOwnProperty("geometry"))
                        {
                            // 5. Get the geometry data array and initialize the array of sub-territory geometries
                            var territory = territoryData[i].geometry;
                            var territoryGeometries = [];

                            // 6. Iterate on each sub-territory array in the geometry array
                            for (var j = 0; j < territory.length; j++)
                            {
                                // 7. Convert the points in 2D vectors, then use them to create a shape and finally use the shape to create an extrude geometry
                                var territoryVectors = computeVectors(territory[j]);
                                var territoryShape = new THREE.Shape(territoryVectors);
                                var territoryGeometry = new THREE.ExtrudeGeometry(territoryShape, extrudeSettings);

                                // 8. Iterate on each face of the extrude geometry just created
                                for ( var face in territoryGeometry.faces ) {
                                    // 8. If it's a back face, put it the materialIndex 2 (not visible)
                                    if (territoryGeometry.faces[ face ].normal.z < -0.99) // Some normals equal (0, 0, 0.99999) when they should equal (0, 0, 1)
                                    {
                                        territoryGeometry.faces[ face ].materialIndex = 2;
                                    }
                                }

                                // 9. Fill the array of sub-territory geometries
                                territoryGeometries.push(territoryGeometry);
                            }

                            // 10. Iterate on each sub-territory geometry just created
                            for (var j = 0; j < territoryGeometries.length - 1; j++)
                            {
                                // 11. Merge them all to only have to manipulate one geometry
                                territoryGeometries[0].merge(territoryGeometries[j+1]);
                            }

                            // 12. Fill the array of territory geometries
                            territories.push(territoryGeometries[0]);
                        }
                        else
                        {
                            console.log("Warning : JSON data misses a 'geometry' property !");
                        }

                    }

                    // 13. Return the array of final territory geometries
                    return territories;

                }
                
            },

            // Return an array of THREE.Box Geometry objects containing the merged geometries of the 105 territory outlines
            getOutlines: function()
            {

                // 1. Initialize the array of final territory outline geometries
                var outlines = [];

                // 2. Check if territory data has already been sent to the service
                if (!dataIsReady)
                {
                    console.log("Warning : No territory data !");
                    return outlines;
                }
                else
                {
                    // 3. Iterate on each territory object
                    for (var i = 0; i < numberOfTerritories; i++)
                    {
                        // 4. Check if the territory has an array of outlines
                        if (territoryData[i].hasOwnProperty("outline"))      // Prefer "===" if there is a lot of iteration. Performances are the same for less than 10 000 iterations. HasOwnProperty brings more security, so use it if don't have a lot of iterations.
                        {
                            // 5. Get the outline data array and initialize the array of sub-outline geometries
                            var outline = territoryData[i].outline;  // Later, think to omit the if statement , all territories will eventually get an outline
                            var outlineGeometries = [];

                            // 6. Iterate on each sub-outline array in the outline array
                            for (var j = 0; j < outline.length; j++)
                            {
                                // 7. Convert the points in 2D vectors and initialize the array of outline fragment geometries
                                var outlineVectors = computeVectors(outline[j]);
                                var outlineBoxGeometries = [];

                                // 8. Iterate on each vector of the sub-outline array
                                for (var k = 0; k < outlineVectors.length-1; k++)
                                {
                                    // 9. Compute the vector between two vertices and its magnitude
                                    var v = outlineVectors[k+1].clone().sub(outlineVectors[k]);
                                    var length = v.length();

                                    // 10. Create a box geometry using the magnitude to adjust the length
                                    var outlineBoxGeometry = new THREE.BoxGeometry(0.5, length, 0.5);

                                    // 11. Compute the angle between the Y axis and the outline and then rotate the outline fragment  geometry
                                    if ((v.x <= 0 && v.y > 0) || (v.x >= 0 && v.y < 0))
                                    {
                                        var angle = Math.acos(Math.abs(v.y)/length);
                                        outlineBoxGeometry.rotateZ(angle);
                                    }
                                    else
                                    {
                                        var angle = Math.acos(Math.abs(v.x)/length);
                                        outlineBoxGeometry.rotateZ(angle - Math.PI / 2);
                                    }

                                    // 12. Then translate the outline fragment geometry to its place on the map
                                    outlineBoxGeometry.translate(outlineVectors[k].x + v.x/2, outlineVectors[k].y + v.y/2, 2.5);

                                    // 13. Fill the array of outline fragment geometries
                                    outlineBoxGeometries.push(outlineBoxGeometry);

                                }

                                // 14. Iterate on each outline fragment geometry just created
                                for (var k = 0; k < outlineBoxGeometries.length - 1; k++)
                                {
                                    // 15. Merge them all to only have to manipulate one geometry
                                    outlineBoxGeometries[0].merge(outlineBoxGeometries[k+1]); // do I need the matrix ?
                                }

                                // 16. Fill the array of sub-outline geometries
                                outlineGeometries.push(outlineBoxGeometries[0]);

                            }

                            // 17. Iterate on each sub-outline geometry just created
                            for (var j = 0; j < outlineGeometries.length - 1; j++)
                            {
                                // 18. Merge them all to only have to manipulate one geometry
                                outlineGeometries[0].merge(outlineGeometries[j+1]); // do I need the matrix ?
                            }

                            // 19. Fill the array of final outline geometries
                            outlines.push(outlineGeometries[0]);

                        }
                        else
                        {
                            console.log("Warning : JSON data misses an 'outline' property !");
                        }

                    }

                    // 20. Return the array of final outline geometries
                    return outlines;

                }

            },

            // Return an array of THREE.Box Geometry objects containing the merged geometries of the mountain outlines
            getMountainOutlines: function()
            {
                // 1. Initialize the array of final mountain outline geometries
                var mountainOutlines = [];

                // 2. Check if territory data has already been sent to the service
                if (!dataIsReady)
                {
                    console.log("Warning : No territory data !");
                    return mountainOutlines;
                }
                else
                {
                    // 3. Iterate on each territory object
                    for (var i = 0; i < numberOfTerritories; i++)
                    {
                        // 4. Check if the territory has an array of mountain outlines
                        if (territoryData[i].hasOwnProperty("mountain"))      // Prefer "===" if there is a lot of iteration. Performances are the same for less than 10 000 iterations. HasOwnProperty brings more security, so use it if don't have a lot of iterations.
                        {
                            // 5. Get the mountain outline data array and initialize the array of sub-mountain outline geometries
                            var mountainOutline = territoryData[i].mountain;  // Later, think to omit the if statement , all territories will eventually get an outline
                            var mountainOutlineGeometries = [];

                            // 6. Iterate on each sub-mountain outline array in the mountain outline array
                            for (var j = 0; j < mountainOutline.length; j++)
                            {
                                // 7. Convert the points in 2D vectors and initialize the array of mountain outline fragment geometries
                                var mountainOutlineVectors = computeVectors(mountainOutline[j]);
                                var mountainOutlineBoxGeometries = [];

                                // 8. Iterate on each vector of the sub-mountain outline array
                                for (var k = 0; k < mountainOutlineVectors.length-1; k++)
                                {
                                    // 9. Compute the vector between two vertices and its magnitude
                                    var v = mountainOutlineVectors[k+1].clone().sub(mountainOutlineVectors[k]);
                                    var length = v.length();

                                    // 10. Create a box geometry using the magnitude to adjust the length
                                    var mountainOutlineBoxGeometry = new THREE.BoxGeometry(1, length+0.5, 0.5);

                                    // 11. Compute the angle between the Y axis and the outline and then rotate the mountain outline fragment  geometry
                                    if ((v.x <= 0 && v.y > 0) || (v.x >= 0 && v.y < 0))
                                    {
                                        var angle = Math.acos(Math.abs(v.y)/length);
                                        mountainOutlineBoxGeometry.rotateZ(angle);
                                    }
                                    else
                                    {
                                        var angle = Math.acos(Math.abs(v.x)/length);
                                        mountainOutlineBoxGeometry.rotateZ(angle - Math.PI / 2);
                                    }

                                    // 12. Then translate the mountain outline fragment geometry to its place on the map
                                    mountainOutlineBoxGeometry.translate(mountainOutlineVectors[k].x + v.x/2, mountainOutlineVectors[k].y + v.y/2, 2.7);

                                    // 13. Fill the array of mountain outline fragment geometries
                                    mountainOutlineBoxGeometries.push(mountainOutlineBoxGeometry);

                                }

                                // 14. Iterate on each mountain outline fragment geometry just created
                                for (var k = 0; k < mountainOutlineBoxGeometries.length - 1; k++)
                                {
                                    // 15. Merge them all to only have to manipulate one geometry
                                    mountainOutlineBoxGeometries[0].merge(mountainOutlineBoxGeometries[k+1]); // do I need the matrix ?
                                }

                                // 16. Fill the array of sub-mountain outline geometries
                                mountainOutlineGeometries.push(mountainOutlineBoxGeometries[0]);

                            }

                            // 17. Iterate on each sub-mountain outline geometry just created
                            for (var j = 0; j < mountainOutlineGeometries.length - 1; j++)
                            {
                                // 18. Merge them all to only have to manipulate one geometry
                                mountainOutlineGeometries[0].merge(mountainOutlineGeometries[j+1]); // do I need the matrix ?
                            }

                            // 19. Fill the array of final mountain outline geometries
                            mountainOutlines.push(mountainOutlineGeometries[0]);

                        }
                        else
                        {
                            // It's normal, in most cases territories don't have mountain outlines
                        }

                    }

                    // 20. Return the array of final mountain outline geometries
                    return mountainOutlines;

                }

            },

            // Return an array of THREE.Box Geometry objects containing the merged geometries of the 8 nation frontiers
            getFrontiers: function()
            {
                // 1. Initialize the array of final frontier geometries
                var frontiers = [];

                // 2. Check if territory data has already been sent to the service
                if (!dataIsReady)
                {
                    console.log("Warning : No territory data !");
                    return frontiers;
                }
                else
                {
                    // 3. Iterate on each territory object
                    for (var i = 0; i < numberOfTerritories; i++)
                    {
                        // 4. Check if the territory has an array of frontiers
                        if (territoryData[i].hasOwnProperty('frontier'))      // Prefer "===" if there is a lot of iteration. Performances are the same for less than 10 000 iterations. HasOwnProperty brings more security, so use it if don't have a lot of iterations.
                        {
                            // 5. Get the frontier data array and initialize the array of sub-frontier geometries
                            var frontier = territoryData[i].frontier;
                            var clockwise = territoryData[i].clockwise;
                            var frontierGeometries = [];

                            // 6. Iterate on each sub-frontier array in the frontier array
                            for (var j = 0; j < frontier.length; j++)
                            {
                                // 7. Convert the points in 2D vectors and initialize the array of frontier fragment geometries
                                var frontierVectors = computeVectors(frontier[j]);
                                var frontierBoxGeometries = [];

                                // 8. Iterate on each vector of the sub-frontier array
                                for (var k = 0; k < frontierVectors.length - 1; k++)
                                {
                                    // 9. Compute the vector between two vertices and its magnitude
                                    var v = frontierVectors[k + 1].clone().sub(frontierVectors[k]);
                                    var length = v.length();

                                    // 10. Create a box geometry using the magnitude to adjust the length
                                    var frontierBoxGeometry = new THREE.BoxGeometry(0.5, length, 0.5);

                                    // 11. Compute the angle between the Y axis and the outline and then rotate the frontier fragment  geometry
                                    if ((v.x <= 0 && v.y > 0) || (v.x >= 0 && v.y < 0))
                                    {
                                        var angle = Math.acos(Math.abs(v.y) / length);
                                        frontierBoxGeometry.rotateZ(angle);
                                    }
                                    else
                                    {
                                        var angle = Math.acos(Math.abs(v.x) / length);
                                        frontierBoxGeometry.rotateZ(angle - Math.PI / 2);
                                    }

                                    // 12. Then translate the frontier fragment geometry to its place on the map
                                    frontierBoxGeometry.translate(frontierVectors[k].x + v.x / 2, frontierVectors[k].y + v.y / 2, 2.6);

                                    if (clockwise)      // If frontier data is stored clockwise or counter clockwise, it has an incidence in the computing of the angle)
                                    {
                                        var normal = new THREE.Vector3(v.y, -v.x, 0).normalize();
                                        frontierBoxGeometry.translate(normal.x * 0.5, normal.y * 0.5, 0);
                                    }
                                    else
                                    {
                                        var normal = new THREE.Vector3(-v.y, v.x, 0).normalize();
                                        frontierBoxGeometry.translate(normal.x * 0.5, normal.y * 0.5, 0);
                                    }

                                    // 13. Fill the array of frontier fragment geometries
                                    frontierBoxGeometries.push(frontierBoxGeometry);

                                }

                                // 14. Iterate on each frontier fragment geometry just created
                                for (var k = 0; k < frontierBoxGeometries.length - 1; k++)
                                {
                                    // 15. Merge them all to only have to manipulate one geometry
                                    frontierBoxGeometries[0].merge(frontierBoxGeometries[k + 1]);
                                }

                                // 16. Fill the array of sub-frontier geometries
                                frontierGeometries.push(frontierBoxGeometries[0]);

                            }

                            // 17. Iterate on each sub-frontier geometry just created
                            for (var j = 0; j < frontierGeometries.length - 1; j++)
                            {
                                // 18. Merge them all to only have to manipulate one geometry
                                frontierGeometries[0].merge(frontierGeometries[j + 1]); // do I need the matrix ?
                            }

                            // 19. Fill the array of final frontier geometries
                            frontiers.push(frontierGeometries[0]);

                        }
                        else
                        {

                            // It's normal, every territory is not part of a nation
                        }

                    }

                    // 20. Return the array of final frontier geometries
                    return frontiers;

                }

            },

            getHelmsDeep: function ()
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
                bigWallGeometry.merge(box.translate(-0.425, -0.4, -0.2));

                box = new THREE.BoxGeometry(0.05, 0.175, 0.05);
                bigWallGeometry.merge(box.translate(-0.325, -0.3875, -0.2));

                box = new THREE.BoxGeometry(0.3, 0.2, 0.05);
                bigWallGeometry.merge(box.translate(-0.15, -0.4, -0.2));

                // Tunnel
                box = new THREE.BoxGeometry(0.05, 0.025, 0.05);
                box = new ThreeBSP(box.translate(-0.325, -0.4875, -0.2));
                cylinder = new THREE.CylinderGeometry(0.025, 0.025, 0.05, 4, 1, false, Math.PI/2, Math.PI);
                cylinder = new ThreeBSP(cylinder.rotateX(Math.PI/2).translate(-0.325, -0.5, -0.2));
                bspResult = box.subtract(cylinder).toGeometry();
                bigWallGeometry.merge(bspResult);

                cylinder = new THREE.CylinderGeometry(0.001, 0.001, 0.025, 6, 1, true);
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

                // Adds the big wall geometry to the final geometry
                helmsDeepGeometry.merge(bigWallGeometry);


                // 3. Create the stronghold geometry
                var strongholdGeometry = new THREE.Geometry();

                // Main structure
                lathePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.2, 0.0),
                    new THREE.Vector2(0.2, 0.35),
                    new THREE.Vector2(0.15, 0.35),
                    new THREE.Vector2(0.15, 0.2),
                    new THREE.Vector2(0.125, 0.2),
                    new THREE.Vector2(0.125, 0.45),
                    new THREE.Vector2(0.1, 0.45),
                    new THREE.Vector2(0.1, 0.35),
                    new THREE.Vector2(0.0, 0.35)
                ];
                lathe = new THREE.LatheGeometry(lathePoints, 6, -Math.PI/2, 6*Math.PI/9);
                strongholdGeometry.merge(lathe.translate(0.3, -0.5, -0.2));

                lathe = new THREE.LatheGeometry(lathePoints, 2, 5*Math.PI/18, 2*Math.PI/9);
                strongholdGeometry.merge(lathe.translate(0.3, -0.5, -0.2));

                lathePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.2, 0.0),
                    new THREE.Vector2(0.2, 0.35),
                    new THREE.Vector2(0.15, 0.35),
                    new THREE.Vector2(0.15, 0.2),
                    new THREE.Vector2(0.125, 0.2),
                    new THREE.Vector2(0.125, 0.35),
                    new THREE.Vector2(0.0, 0.35)
                ];
                lathe = new THREE.LatheGeometry(lathePoints, 1, 3*Math.PI/18, Math.PI/9);
                strongholdGeometry.merge(lathe.translate(0.3, -0.5, -0.2));

                // Tunnel at the 2nd floor
                lathePoints = [
                    new THREE.Vector2(0.125, 0.35),
                    new THREE.Vector2(0.125, 0.45),
                    new THREE.Vector2(0.1, 0.45),
                    new THREE.Vector2(0.1, 0.35)
                ];
                lathe = new THREE.LatheGeometry(lathePoints, 1, 3*Math.PI/18, Math.PI/9);
                lathe = new ThreeBSP(lathe.translate(0.3, -0.5, -0.2));
                box = new THREE.BoxGeometry(0.01875, 0.01875, 0.05);
                box = new ThreeBSP(box.rotateY(THREE.Math.degToRad(40)).translate(0.36330222215, -0.15+0.01875/2, -0.12455934932));
                cylinder = new THREE.CylinderGeometry(0.01875/2, 0.01875/2, 0.05, 6, 1, false, Math.PI/2, Math.PI);
                cylinder = new ThreeBSP(cylinder.rotateX(Math.PI/2).rotateY(THREE.Math.degToRad(40)).translate(0.36330222215, -0.15+0.01875, -0.12455934932));
                bspResult = lathe.subtract(box.union(cylinder)).toGeometry();
                strongholdGeometry.merge(bspResult);

                lathePoints = [
                    new THREE.Vector2(0.1, 0.35),
                    new THREE.Vector2(0.1, 0.45),
                    new THREE.Vector2(0.075, 0.45),
                    new THREE.Vector2(0.075, 0.35)
                ];
                lathe = new THREE.LatheGeometry(lathePoints, 1, 3*Math.PI/18, Math.PI/9);
                lathe = new ThreeBSP(lathe.translate(0.3, -0.5, -0.2));
                bspResult = lathe.subtract(box.union(cylinder)).toGeometry();
                strongholdGeometry.merge(bspResult);

                // Stairs
                lathePoints = [
                    new THREE.Vector2(0.1, 0.45),
                    new THREE.Vector2(0.075, 0.45),
                    new THREE.Vector2(0.075, 0.35)
                ];
                lathe = new THREE.LatheGeometry(lathePoints, 2, 5*Math.PI/18, 2*Math.PI/9);
                strongholdGeometry.merge(lathe.translate(0.3, -0.5, -0.2));

                lathe = new THREE.LatheGeometry(lathePoints, 4, -5*Math.PI/18, 4*Math.PI/9);
                length = lathe.vertices.length;
                for (var i = 0; i < length/3; i++)
                {
                    lathe.vertices[i*3].y -= 0.1 * (1 - (i/(length/3 - 1)));
                    lathe.vertices[i*3+1].y -= 0.1 * (1 - (i/(length/3 - 1)));
                }
                strongholdGeometry.merge(lathe.translate(0.3, -0.5, -0.2));

                lathePoints = [
                    new THREE.Vector2(0.15, 0.325),
                    new THREE.Vector2(0.125, 0.325)
                ];
                lathe = new THREE.LatheGeometry(lathePoints, 4, -Math.PI/2, 4*Math.PI/9);
                length = lathe.vertices.length;
                for (var i = 0; i < length/2; i++)
                {
                    lathe.vertices[i*2].y -= 0.125 * (i/(length/2 - 1));
                    lathe.vertices[i*2+1].y -= 0.125 * (i/(length/2 - 1));
                }
                strongholdGeometry.merge(lathe.translate(0.3, -0.5, -0.2));

                // Back of the main structure
                box = new THREE.BoxGeometry(0.025, 0.35, 0.1);
                strongholdGeometry.merge(box.translate(0.1125, -0.325, -0.25));

                box = new THREE.BoxGeometry(0.025, 0.35, 0.025);
                strongholdGeometry.merge(box.translate(0.1375, -0.325, -0.2125));

                box = new THREE.BoxGeometry(0.025, 0.35, 0.05);
                box.vertices[1].y -= 0.025;
                box.vertices[4].y -= 0.025;
                strongholdGeometry.merge(box.translate(0.1375, -0.325, -0.25));

                box = new THREE.BoxGeometry(0.05, 0.325, 0.025);
                strongholdGeometry.merge(box.translate(0.15, -0.3375, -0.2875));

                box = new THREE.BoxGeometry(0.025, 0.325, 0.075);
                strongholdGeometry.merge(box.translate(0.1625, -0.3375, -0.2375));

                box = new THREE.BoxGeometry(0.025, 0.45, 0.1);
                strongholdGeometry.merge(box.translate(0.1875, -0.275, -0.25));

                plane = new THREE.PlaneGeometry(0.05, 0.45, 1, 1);
                strongholdGeometry.merge(plane.rotateY(Math.PI).translate(0.4, -0.275, -0.2));

                plane = new THREE.PlaneGeometry(0.025, 0.2, 1, 1);
                strongholdGeometry.merge(plane.rotateY(Math.PI).translate(0.4375, -0.4, -0.2));

                plane = new THREE.PlaneGeometry(0.05, 0.35, 1, 1);
                strongholdGeometry.merge(plane.rotateY(Math.PI).translate(0.475, -0.325, -0.2));

                // Little bridge
                box = new THREE.BoxGeometry(0.025, 0.0125, 0.02462);    // 0.02462 instead of 0.025 because of lathe geometry precision
                // X: pos + offset  // Y: pos   // Z: pos + offset
                // 0.3 + 0.08704    // -0.15625 // -0.2 + 0.103731
                box = new ThreeBSP(box.rotateY(THREE.Math.degToRad(40)).translate(0.38704, -0.15625, -0.096269));
                cylinder = new THREE.CylinderGeometry(0.015625, 0.015625, 0.025, 4, 1, false, 1*Math.PI/6, 2*Math.PI/3);
                // X: pos + offset  // Y: pos   // Z: pos + offset
                // 0.3 + 0.08704    // -0.16875 // -0.2 + 0.103731
                cylinder = new ThreeBSP(cylinder.rotateZ(Math.PI/2).rotateY(THREE.Math.degToRad(40)).translate(0.38704, -0.16875, -0.096269));
                bspResult = box.subtract(cylinder).toGeometry();
                strongholdGeometry.merge(bspResult);

                // Battlements of the outer wall
                extrudePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.065, 0.0),
                    new THREE.Vector2(0.065, 0.002),
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
                // X: pos   // Y: pos + amount/2    // Z: pos - depth/2 - 3*bevel/4 - offset
                // 0.0      // 0.0 + 0.005          // 0.2 - 0.001 - 0.001875 - 0.003038
                extrude.rotateX(-Math.PI/2).translate(0.0, 0.005, 0.194087);
                extrudes = new THREE.Geometry();
                for (var i = 0; i < 4; i++)
                {
                    extrudes.merge(extrude.clone().rotateY(THREE.Math.degToRad(-80 + (i*20))));
                    extrudes.merge(extrude.clone().rotateY(THREE.Math.degToRad(80 - (i*20))));
                }
                strongholdGeometry.merge(extrudes.translate(0.3, -0.15, -0.2));

                // Battlements of the inner wall
                extrudePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.039, 0.0),
                    new THREE.Vector2(0.039, 0.002),
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
                // X: pos   // Y: pos + amount/2    // Z: pos - depth/2 - 3*bevel/4 - offset
                // 0.0      // 0.0 + 0.005          // 0.125 - 0.001 - 0.001875 - 0.001899
                extrude.rotateX(-Math.PI/2).translate(0.0, 0.005, 0.120226);
                extrudes = new THREE.Geometry();
                for (var i = 0; i < 9; i++)
                {
                    extrudes.merge(extrude.clone().rotateY(THREE.Math.degToRad(-80 + (i*20))));
                }
                strongholdGeometry.merge(extrudes.translate(0.3, -0.05, -0.2));

                // Battlements at the back
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
                extrude.rotateX(Math.PI/2).rotateY(Math.PI/2);
                // X: pos + depth/2 + 3*bevel/4 // Y: pos + amount/2    // Z: pos
                // 0.1 + 0.001 + 0.001875       // -0.15 + 0.005        // -0.275
                strongholdGeometry.merge(extrude.clone().translate(0.102875, -0.145, -0.275));
                // 0.1 + 0.001 + 0.001875       // -0.15 + 0.005        // -0.225
                strongholdGeometry.merge(extrude.clone().translate(0.102875, -0.145, -0.225));
                // 0.175 + 0.001 + 0.001875     // -0.05 + 0.005        // -0.275
                strongholdGeometry.merge(extrude.clone().translate(0.177875, -0.045, -0.275));
                // 0.175 + 0.001 + 0.001875     // -0.05 + 0.005        // -0.225
                strongholdGeometry.merge(extrude.clone().translate(0.177875, -0.045, -0.225));

                // Adds the stronghold geometry to the final geometry
                helmsDeepGeometry.merge(strongholdGeometry);


                // 4. Create the doors geometry
                var doorsGeometry = new THREE.Geometry();

                // Towers
                box = new THREE.BoxGeometry(0.05, 0.375, 0.0625);
                doorsGeometry.merge(box.translate(0.225, -0.3125, 0.00625));

                box = new THREE.BoxGeometry(0.05, 0.375, 0.0625);
                doorsGeometry.merge(box.translate(0.375, -0.3125, 0.00625));

                box = new THREE.BoxGeometry(0.025, 0.349, 0.05);                    // 0.349 instead of 0.345 to avoid superposition side effect
                doorsGeometry.merge(box.translate(0.2625, -0.325-0.0005, 0.0));     // -0.0005 because of above

                box = new THREE.BoxGeometry(0.025, 0.349, 0.05);                    // 0.349 instead of 0.345 to avoid superposition side effect
                doorsGeometry.merge(box.translate(0.3375, -0.325-0.0005, 0.0));     // -0.0005 because of above

                box = new THREE.BoxGeometry(0.05, 0.074, 0.05);                     // 0.074 instead of 0.075 to avoid superposition side effect
                doorsGeometry.merge(box.translate(0.3, -0.1875-0.0005, 0.0));       // -0.0005 because of above

                box = new THREE.BoxGeometry(0.05, 0.2, 0.05);
                doorsGeometry.merge(box.translate(0.3, -0.4, 0.0));

                // Battlements above the doors
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
                // X: pos   // Y: pos + amount/2    // Z: pos - depth/2 - 3*bevel/4
                // 0.275    // -0.15 + 0.005        // 0.025 - 0.001 - 0.001875
                doorsGeometry.merge(extrude.clone().translate(0.275, -0.145, 0.022125));
                // 0.325    // -0.15 + 0.005        // 0.025 - 0.001 - 0.001875
                doorsGeometry.merge(extrude.clone().translate(0.325, -0.145, 0.022125));

                // Battlements of the towers
                extrudePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.022, 0.0),
                    new THREE.Vector2(0.022, 0.002),
                    new THREE.Vector2(0.0, 0.002),
                    new THREE.Vector2(0.0, 0.0)
                ];
                extrudeOptions = {
                    curveSegments: 1,
                    steps: 1,
                    amount: 0.0075,
                    bevelEnabled: true,
                    bevelThickness: 0.0075,
                    bevelSize: 0.0015,
                    bevelSegments: 1,
                    material: 0,
                    extrudeMaterial: 1
                };
                extrudeShape = new THREE.Shape(extrudePoints);
                extrude = new THREE.ExtrudeGeometry(extrudeShape, extrudeOptions);
                extrude.center();
                extrude.rotateX(Math.PI/2);
                // X: pos   // Y: pos + amount/2    // Z: pos + depth/2 + 3*bevel/4
                // 0.2125   // -0.125 + 0.00375     // -0.025 + 0.001 + 0.001125
                doorsGeometry.merge(extrude.clone().translate(0.2125, -0.12125, -0.022875));
                // 0.3875   // -0.125 + 0.00375     // -0.025 + 0.001 + 0.001125
                doorsGeometry.merge(extrude.clone().translate(0.3875, -0.12125, -0.022875));
                // X: pos   // Y: pos + amount/2    // Z: pos - depth/2 - 3*bevel/4
                // 0.2125   // -0.125 + 0.00375     // 0.0375 - 0.001 - 0.001125
                doorsGeometry.merge(extrude.clone().translate(0.2125, -0.12125, 0.035375));
                // 0.3875   // -0.125 + 0.00375     // 0.0375 - 0.001 - 0.001125
                doorsGeometry.merge(extrude.clone().translate(0.3875, -0.12125, 0.035375));
                // 0.2375   // -0.125 + 0.00375     // 0.0375 - 0.001 - 0.001125
                doorsGeometry.merge(extrude.clone().translate(0.2375, -0.12125, 0.035375));
                // 0.3625   // -0.125 + 0.00375     // 0.0375 - 0.001 - 0.001125
                doorsGeometry.merge(extrude.clone().translate(0.3625, -0.12125, 0.035375));

                extrudePoints = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.02825, 0.0),
                    new THREE.Vector2(0.02825, 0.002),
                    new THREE.Vector2(0.0, 0.002),
                    new THREE.Vector2(0.0, 0.0)
                ];
                extrudeOptions = {
                    curveSegments: 1,
                    steps: 1,
                    amount: 0.0075,
                    bevelEnabled: true,
                    bevelThickness: 0.0075,
                    bevelSize: 0.0015,
                    bevelSegments: 1,
                    material: 0,
                    extrudeMaterial: 1
                };
                extrudeShape = new THREE.Shape(extrudePoints);
                extrude = new THREE.ExtrudeGeometry(extrudeShape, extrudeOptions);
                extrude.center();
                extrude.rotateX(Math.PI/2).rotateY(Math.PI/2);
                // X: pos + depth/2 + 3*bevel/4 // Y: pos + amount/2    // Z: pos
                // 0.2 + 0.001 + 0.001125       // -0.125 + 0.00375     // -0.009375
                doorsGeometry.merge(extrude.clone().translate(0.202125, -0.12125, -0.009375));
                // 0.2 + 0.001 + 0.001125       // -0.125 + 0.00375     // 0.021875
                doorsGeometry.merge(extrude.clone().translate(0.202125, -0.12125, 0.021875));
                // 0.35 + 0.001 + 0.001125      // -0.125 + 0.00375     // 0.021875
                doorsGeometry.merge(extrude.clone().translate(0.352125, -0.12125, 0.021875));
                // X: pos - depth/2 - 3*bevel/4 // Y: pos + amount/2    // Z: pos
                // 0.25 - 0.001 - 0.001125      // -0.125 + 0.00375     // 0.021875
                doorsGeometry.merge(extrude.clone().translate(0.247875, -0.12125, 0.021875));
                // 0.4 - 0.001 - 0.001125       // -0.125 + 0.00375     // 0.021875
                doorsGeometry.merge(extrude.clone().translate(0.397875, -0.12125, 0.021875));
                // 0.4 - 0.001 - 0.001125       // -0.125 + 0.00375     // -0.009375
                doorsGeometry.merge(extrude.clone().translate(0.397875, -0.12125, -0.009375));

                // Door
                box = new THREE.BoxGeometry(0.05, 0.025, 0.05);
                box = new ThreeBSP(box.translate(0.3, -0.25+0.0125, 0.0));
                cylinder = new THREE.CylinderGeometry(0.025, 0.025, 0.05, 6, 1, false, Math.PI/2, Math.PI);
                cylinder = new ThreeBSP(cylinder.rotateX(Math.PI/2).translate(0.3, -0.25, 0.0));
                bspResult = box.subtract(cylinder).toGeometry();
                doorsGeometry.merge(bspResult);

                // Adds the doors geometry to the final geometry
                helmsDeepGeometry.merge(doorsGeometry);


                // 5. Create the bridge geometry
                var bridgeGeometry = new THREE.Geometry();

                // Arch
                box = new THREE.BoxGeometry(0.0125, 0.025, 0.025);
                box.vertices[5].z -= 0.0125;
                box.vertices[7].z -= 0.0125;
                bridgeGeometry.merge(box.translate(0.25625, -0.3125, 0.0375));

                box = new THREE.BoxGeometry(0.0125, 0.025, 0.025);
                box.vertices[0].z -= 0.0125;
                box.vertices[2].z -= 0.0125;
                bridgeGeometry.merge(box.translate(0.34375, -0.3125, 0.0375));

                box = new THREE.BoxGeometry(0.075, 0.025, 0.2);
                bridgeGeometry.merge(box.translate(0.3, -0.3125, 0.125));

                box = new THREE.BoxGeometry(0.075, 0.175, 0.025);
                bridgeGeometry.merge(box.translate(0.3, -0.4125, 0.2125));

                box = new THREE.BoxGeometry(0.075, 0.1, 0.1);
                box = new ThreeBSP(box.translate(0.3, -0.375, 0.15));
                cylinder = new THREE.CylinderGeometry(0.1, 0.1, 0.075, 6 ,1, false, 0, Math.PI/2);
                cylinder= new ThreeBSP(cylinder.rotateZ(Math.PI/2).translate(0.3, -0.425, 0.1));
                bspResult = box.subtract(cylinder).toGeometry();
                bridgeGeometry.merge(bspResult);

                // Slope
                lathePoints = [
                    new THREE.Vector2(0.2, 0.0),
                    new THREE.Vector2(0.275, 0.0),
                    new THREE.Vector2(0.275, 0.2),
                    new THREE.Vector2(0.2, 0.2),
                    new THREE.Vector2(0.2, 0.0)
                ];
                lathe = new THREE.LatheGeometry(lathePoints, 3, 0, Math.PI/2);
                length = lathe.vertices.length;
                for (var i = 0; i < length/4; i++)
                {
                    lathe.vertices[i*4+2].y -= 0.2 * (1 - (i/(length/4 - 1)));
                    lathe.vertices[i*4+3].y -= 0.2 * (1 - (i/(length/4 - 1)));
                }
                lathe.translate(0.0625, -0.5, 0.225);
                bridgeGeometry.merge(lathe);

                // Adds the bridge geometry to the final geometry
                helmsDeepGeometry.merge(bridgeGeometry);


                // 6. Create the entry of caverns geometry
                var cavernsGeometry = new THREE.Geometry();

                // Stairs
                box = new THREE.BoxGeometry(0.025, 0.35, 0.1);
                cavernsGeometry.merge(box.translate(0.2125, -0.325, -0.25));

                box = new THREE.BoxGeometry(0.15, 0.35, 0.125);
                cavernsGeometry.merge(box.translate(0.3, -0.325, -0.2625));

                box = new THREE.BoxGeometry(0.15, 0.05, 0.025);
                cavernsGeometry.merge(box.translate(0.3, -0.125, -0.3125));

                box = new THREE.BoxGeometry(0.15, 0.05, 0.1);
                box.vertices[0].y -= 0.05;
                box.vertices[5].y -= 0.05;
                box.vertices[5].x += 0.025;
                box.vertices[7].x += 0.025;
                cavernsGeometry.merge(box.translate(0.3, -0.125, -0.25));

                box = new THREE.BoxGeometry(0.05, 0.05625, 0.00625);
                cavernsGeometry.merge(box.translate(0.35, -0.121875, -0.2));

                box = new THREE.BoxGeometry(0.025, 0.05625, 0.00625);
                cavernsGeometry.merge(box.translate(0.2625, -0.121875, -0.2));

                box = new THREE.BoxGeometry(0.1, 0.05625, 0.00625);
                cavernsGeometry.merge(box.rotateY(-2*Math.PI/5).translate(0.2375, -0.121875, -0.25));

                box = new THREE.BoxGeometry(0.125, 0.05625, 0.00625);
                cavernsGeometry.merge(box.rotateY(Math.PI/2).translate(0.375, -0.121875, -0.2625));

                box = new THREE.BoxGeometry(0.025, 0.05625, 0.00625);
                cavernsGeometry.merge(box.rotateY(Math.PI/2).translate(0.225, -0.121875, -0.3125));

                box = new THREE.BoxGeometry(0.15, 0.4, 0.03125);
                cavernsGeometry.merge(box.translate(0.3, -0.3, -0.340625));

                // Archs, full blocks
                var archs = new THREE.Geometry();
                box = new THREE.BoxGeometry(0.00625, 0.059375, 0.00625);
                for (var i = 0; i < 2; i++)
                {
                    archs.merge(box.clone().translate(-0.046875 + i * 0.025, -0.0328125, 0.0125));
                    archs.merge(box.clone().translate(+0.046875 - i * 0.025, -0.0328125, 0.0125));
                }

                box = new THREE.BoxGeometry(0.00625, 0.059375, 0.03125);
                archs.merge(box.clone().translate(-0.071875, -0.0328125, 0.0));
                archs.merge(box.clone().translate(+0.071875, -0.0328125, 0.0));

                box = new THREE.BoxGeometry(0.05625, 0.046875, 0.03125);
                archs.merge(box.clone().translate(-0.046875, 0.0203125, 0.0));
                archs.merge(box.clone().translate(+0.046875, 0.0203125, 0.0));

                box = new THREE.BoxGeometry(0.0375, 0.0125, 0.03125);
                archs.merge(box.translate(0.0, 0.0375, 0.0));

                box = new THREE.BoxGeometry(0.0078125, 0.015625, 0.03125);
                archs.merge(box.translate(-0.07109375, 0.0515625, 0.0));
                archs.merge(box.clone().rotateY(Math.PI));

                box = new THREE.BoxGeometry(0.009375, 0.015625, 0.03125);
                for (var i = 0; i < 2; i++)
                {
                    archs.merge(box.clone().translate(-0.046875 + i * 0.025, 0.0515625, 0.0));
                    archs.merge(box.clone().translate(+0.046875 - i * 0.025, 0.0515625, 0.0));
                }

                box = new THREE.BoxGeometry(0.003125, 0.015625, 0.03125);
                archs.merge(box.translate(0.0, 0.0515625, 0.0));
                for (var i = 0; i < 3; i++)
                {
                    archs.merge(box.clone().translate(-0.059375 + i * 0.025, 0.0, 0.0));
                    archs.merge(box.clone().translate(+0.059375 - i * 0.025, 0.0, 0.0));
                }

                box = new THREE.BoxGeometry(0.15, 0.003125, 0.03125);
                archs.merge(box.translate(0.0, 0.0609375, 0.0));

                box = new THREE.BoxGeometry(0.05, 0.059375, 0.00625);
                archs.merge(box.clone().translate(-0.04375, -0.0328125, -0.0125));
                archs.merge(box.clone().translate(+0.04375, -0.0328125, -0.0125));

                // Archs, CSG blocks
                box = new THREE.BoxGeometry(0.0375, 0.01875, 0.03125);
                box = new ThreeBSP(box.translate(0.0, 0.021875, 0.0));
                cylinder = new THREE.CylinderGeometry(0.01875, 0.01875, 0.03125, 6, 1, false, Math.PI/2, Math.PI);
                cylinder = new ThreeBSP(cylinder.rotateX(Math.PI/2).translate(0.0, 0.0125, 0.0));
                bspResult = box.subtract(cylinder).toGeometry();
                archs.merge(bspResult);

                box = new THREE.BoxGeometry(0.01875, 0.009375, 0.025);
                box = new ThreeBSP(box.translate(0.0, 0.0046875, 0.003125));
                box2 = new THREE.BoxGeometry(0.00625, 0.009375, 0.01875);
                box2 = new ThreeBSP(box2.translate(0.0125, 0.0046875, 0.0));
                cylinder = new THREE.CylinderGeometry(0.009375, 0.009375, 0.025, 6, 1, false, 0, Math.PI);
                cylinder2 = cylinder.clone();
                cylinder = new ThreeBSP(cylinder.rotateZ(Math.PI/2).translate(0.003125, 0.0, 0.0));
                cylinder2 = new ThreeBSP(cylinder2.rotateZ(Math.PI/2).rotateY(Math.PI/2).translate(0.0, 0.0, 0.003125));
                bspResult = box.union(box2).subtract(cylinder.union(cylinder2)).toGeometry();
                for (var i = 0; i < 2; i++)
                {
                    archs.merge(bspResult.clone().translate(-0.059375 + i * 0.025, -0.0125, 0.0));
                    archs.merge(bspResult.clone().rotateY(-Math.PI/2).translate(+0.059375 - i * 0.025, -0.0125, 0.0));
                }

                box = new THREE.BoxGeometry(0.00625, 0.003125, 0.03125);
                box = new ThreeBSP(box.translate(0.0, 0.0015625, 0.0));
                cylinder = new THREE.CylinderGeometry(0.003125, 0.003125, 0.03125, 6, 1, false, Math.PI/2, Math.PI);
                cylinder = new ThreeBSP(cylinder.rotateX(Math.PI/2));
                bspResult = box.subtract(cylinder).toGeometry();
                for (var i = 0; i < 3; i++)
                {
                    archs.merge(bspResult.clone().translate(-0.0640625 + i * 0.025, 0.05625, 0.0));
                    archs.merge(bspResult.clone().translate(-0.0546875 + i * 0.025, 0.05625, 0.0));
                    archs.merge(bspResult.clone().translate(+0.0640625 - i * 0.025, 0.05625, 0.0));
                    archs.merge(bspResult.clone().translate(+0.0546875 - i * 0.025, 0.05625, 0.0));
                }

                cavernsGeometry.merge(archs.translate(0.3, -0.0375, -0.340625));

                // Adds the entry of caverns geometry to the final geometry
                helmsDeepGeometry.merge(cavernsGeometry);


                // 7. Create the tower geometry
                var towerGeometry = new THREE.Geometry();

                // Main structure
                cylinder = new THREE.CylinderGeometry(0.025, 0.075, 0.8, 15, 5);

                /**
                 * radiusTop        = 0.025
                 * radius1          = 0.05
                 * radius2          = 0.05625
                 * radius3          = 0.065625
                 * radius4          = 0.071875
                 * radiusBottom     = 0.075
                 *
                 * height           = 0.8
                 *
                 * height1          = 0.025
                 * height2          = 0.125
                 * height3          = 0.00625
                 * height4          = 0.15
                 * height5          = 0.49375
                 *
                 * radialSegments   = 15
                 * heightSegments   = 5
                 *
                 * offset           = 0.5
                 */

                // Top level
                for (var i = 0; i < 5; i++)
                {
                    // offset * (radius * pos) // Original position is ok for top and bottom levelsnder.vertices[i*3].x *= 0.80901699437;
                    cylinder.vertices[i*3].z *= 0.80901699437;

                    // radius * pos
                    cylinder.vertices[i*3 + 1].x = 0.025 * Math.sin((i*6+3) * Math.PI/15);
                    cylinder.vertices[i*3 + 1].z = 0.025 * Math.cos((i*6+3) * Math.PI/15);

                    // radius * pos
                    cylinder.vertices[i*3 + 2].x = 0.025 * Math.sin((i*6+3) * Math.PI/15);
                    cylinder.vertices[i*3 + 2].z = 0.025 * Math.cos((i*6+3) * Math.PI/15);
                }

                // Second level
                for (var i = 5; i < 10; i++)
                {
                    // radius * pos
                    cylinder.vertices[i*3].x = 0.05 * Math.sin((i*3) * 2*Math.PI/15);
                    cylinder.vertices[i*3].z = 0.05 * Math.cos((i*3) * 2*Math.PI/15);
                    // height / heightSegments - height1
                    cylinder.vertices[i*3].y += 0.135;

                    // offset * radius * pos
                    cylinder.vertices[i*3 + 1].x = 0.025 * Math.sin((i*6+3) * Math.PI/15);
                    cylinder.vertices[i*3 + 1].z = 0.025 * Math.cos((i*6+3) * Math.PI/15);
                    // height / heightSegments
                    cylinder.vertices[i*3 + 1].y += 0.16;

                    // offset * radius * pos
                    cylinder.vertices[i*3 + 2].x = 0.025 * Math.sin((i*6+3) * Math.PI/15);
                    cylinder.vertices[i*3 + 2].z = 0.025 * Math.cos((i*6+3) * Math.PI/15);
                    // height / heightSegments
                    cylinder.vertices[i*3 + 2].y += 0.16;
                }

                // Third level
                for (var i = 10; i < 15; i++)
                {
                    // radius * pos
                    cylinder.vertices[i*3].x = 0.05625 * Math.sin((i*3) * 2*Math.PI/15);
                    cylinder.vertices[i*3].z = 0.05625 * Math.cos((i*3) * 2*Math.PI/15);
                    // 2 * height / heightSegments - height1 - height2
                    cylinder.vertices[i*3].y += 0.17;

                    // offset * radius * pos
                    cylinder.vertices[i*3 + 1].x = 0.0328125 * Math.sin((i*6+3) * Math.PI/15);
                    cylinder.vertices[i*3 + 1].z = 0.0328125 * Math.cos((i*6+3) * Math.PI/15);
                    // 2 * height / heightSegments - height1 - height2
                    cylinder.vertices[i*3 + 1].y += 0.17;

                    cylinder.vertices[i*3 + 2].x = 0.0328125 * Math.sin((i*6+3) * Math.PI/15);
                    cylinder.vertices[i*3 + 2].z = 0.0328125 * Math.cos((i*6+3) * Math.PI/15);
                    // 2 * height / heightSegments - height1 - height2
                    cylinder.vertices[i*3 + 2].y += 0.17;
                }

                // Fourth level
                for (var i = 15; i < 20; i++)
                {
                    // radius * pos
                    cylinder.vertices[i*3].x = 0.065625 * Math.sin((i*3) * 2*Math.PI/15);
                    cylinder.vertices[i*3].z = 0.065625 * Math.cos((i*3) * 2*Math.PI/15);
                    // 3 * height / heightSegments - height1 - height2 - height3
                    cylinder.vertices[i*3].y += 0.32375;

                    // offset * radius * pos
                    cylinder.vertices[i*3 + 1].x = 0.0328125 * Math.sin((i*9+4) * 2*Math.PI/45);
                    cylinder.vertices[i*3 + 1].z = 0.0328125 * Math.cos((i*9+4) * 2*Math.PI/45);
                    // 3 * height / heightSegments - height1 - height2 - height3
                    cylinder.vertices[i*3 + 1].y += 0.32375;

                    // offset * radius * pos
                    cylinder.vertices[i*3 + 2].x = 0.0328125 * Math.sin((i*9+5) *2 *Math.PI/45);
                    cylinder.vertices[i*3 + 2].z = 0.0328125 * Math.cos((i*9+5) *2 *Math.PI/45);
                    // 3 * height / heightSegments - height1 - height2 - height3
                    cylinder.vertices[i*3 + 2].y += 0.32375;
                }

                // Fifth level
                for (var i = 20; i < 25; i++)
                {
                    // radius * pos
                    cylinder.vertices[i*3].x = 0.071875 * Math.sin((i*3) * 2*Math.PI/15);
                    cylinder.vertices[i*3].z = 0.071875 * Math.cos((i*3) * 2*Math.PI/15);
                    // 4 * height / heightSegments - height1 - height2 - height3 - height4
                    cylinder.vertices[i*3].y += 0.33375;

                    // offset * radius * pos
                    cylinder.vertices[i*3 + 1].x = 0.0359375 * Math.sin((i*3+1) * 2*Math.PI/15);
                    cylinder.vertices[i*3 + 1].z = 0.0359375 * Math.cos((i*3+1) * 2*Math.PI/15);
                    // 4 * height / heightSegments - height1 - height2 - height3 - height4
                    cylinder.vertices[i*3 + 1].y += 0.33375;

                    // offset * radius * pos
                    cylinder.vertices[i*3 + 2].x = 0.0359375 * Math.sin((i*3+2) *2 *Math.PI/15);
                    cylinder.vertices[i*3 + 2].z = 0.0359375 * Math.cos((i*3+2) *2 *Math.PI/15);
                    // 4 * height / heightSegments - height1 - height2 - height3 - height4
                    cylinder.vertices[i*3 + 2].y += 0.33375;
                }

                // Sixth level
                for (var i = 25; i < 30; i++)
                {
                    // offset * (radius * pos) Original position is ok for top and bottom levels, just add the offset
                    cylinder.vertices[i*3 + 1].x *= 0.5;
                    cylinder.vertices[i*3 + 1].z *= 0.5;

                    // offset * (radius * pos) Original position is ok for top and bottom levels, just add the offset
                    cylinder.vertices[i*3 + 2].x *= 0.5;
                    cylinder.vertices[i*3 + 2].z *= 0.5;
                }

                towerGeometry.merge(cylinder.translate(0.1, -0.1, -0.35));

                // Ornamentation
                cylinder = new THREE.CylinderGeometry(0.03625, 0.05, 0.13125, 5, 1);
                towerGeometry.merge(cylinder.translate(0.1, 0.146875, -0.35));

                // Crown
                lathePoints = [
                    new THREE.Vector2(0.01727457514, 0.0),
                    new THREE.Vector2(0.025, 0.0),
                    new THREE.Vector2(0.025, 0.0375),
                    new THREE.Vector2(0.01727457514, 0.0375),
                    new THREE.Vector2(0.01727457514, 0.0)
                ];
                lathe = new THREE.LatheGeometry(lathePoints, 4, -Math.PI/5, 8 * Math.PI/5);
                lathe = new ThreeBSP(lathe);
                box = new THREE.BoxGeometry(0.0125, 0.03125, 0.00625);
                boxes = new THREE.Geometry();
                boxes.merge(box.translate(0.0, 0.015625, 0.01710042485));
                boxes.merge(box.rotateY(2*Math.PI/5));
                boxes.merge(box.rotateY(2*Math.PI/5));
                boxes.merge(box.rotateY(2*Math.PI/5));
                boxes = new ThreeBSP(boxes);
                bspResult = lathe.subtract(boxes).toGeometry();
                towerGeometry.merge(bspResult.translate(0.1, 0.3, -0.35));

                cylinder = new THREE.CylinderGeometry(0.00625, 0.00625, 0.00625, 6, 1, false, Math.PI/2, Math.PI);
                cylinder = new ThreeBSP(cylinder.rotateX(Math.PI/2).translate(0.0, 0.025, 0.01710042485));
                box = new THREE.BoxGeometry(0.0125, 0.00625, 0.00625);
                box = new ThreeBSP(box.translate(0.0, 0.028125, 0.01710042485));
                bspResult = box.subtract(cylinder).toGeometry();
                towerGeometry.merge(bspResult.clone().translate(0.1, 0.3, -0.35));
                towerGeometry.merge(bspResult.clone().rotateY(2*Math.PI/5).translate(0.1, 0.3, -0.35));
                towerGeometry.merge(bspResult.clone().rotateY(4*Math.PI/5).translate(0.1, 0.3, -0.35));
                towerGeometry.merge(bspResult.clone().rotateY(6*Math.PI/5).translate(0.1, 0.3, -0.35));

                plane = new THREE.PlaneGeometry(0.00772542485, 0.0375, 1, 1);
                towerGeometry.merge(plane.clone().rotateY(-7*Math.PI/10)
                    .translate(0.02113728756 * Math.sin(-Math.PI/5), 0.01875, 0.02113728756 * Math.cos(-Math.PI/5))
                    .translate(0.1, 0.3, -0.35));
                towerGeometry.merge(plane.clone().rotateY(-Math.PI/10)
                    .translate(0.02113728756 * Math.sin(-3*Math.PI/5), 0.01875, 0.02113728756 * Math.cos(-3*Math.PI/5))
                    .translate(0.1, 0.3, -0.35));

                // Adds the tower geometry to the final geometry
                helmsDeepGeometry.merge(towerGeometry);


                // 8. Return the final geometry
                return helmsDeepGeometry;

            }

        }
    });