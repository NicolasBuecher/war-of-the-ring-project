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

            }

        }
    });