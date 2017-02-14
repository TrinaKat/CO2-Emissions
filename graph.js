"use strict";

// SET UP WEBGL AND HTML CANVAS
var canvas;
var gl;

var numVertices  = 36;

var pointsArray = [];
var normalsArray = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

// variables needed for Phong lighting
// the light is in front of the cube, which is located st z = -10
var lightPosition = vec4(2.0, 2.0, -5.0, 0.0 );   
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

// variables needed for the material of the cube
var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var ambientProduct, diffuseProduct, specularProduct;
var viewerPos;
var program;

// spin
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];

var thetaLoc;

var flag = true;

// call quad() to generate all the vertices/normals for the cube
function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

// generate all the vertices/normals for one face of the cube
function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);


     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[b]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);   
     pointsArray.push(vertices[a]);  
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[d]); 
     normalsArray.push(normal);    
}

// DECLARE VARIABLES FOR UNIFORM LOCATIONS
var modelTransformMatrixLoc;
var cameraTransformMatrixLoc;
var perspectiveMatrixLoc;
var currentColourLoc;

// INITIALIZE ALL TRANSFORMATION MATRICES TO IDENTITY MATRIX
var modelTransformMatrix = mat4();  // identity matrix
var perspectiveMatrix = mat4();
var cameraTransformMatrix = mat4();
var resetCameraTransformMatrix = mat4();  // use to reset camera transforms
var resetPerspectiveMatrix = mat4();  // use to reset perspective projection matrix
var tempModelTransform = mat4();  // use to generate transformations and rotations for each cube

// SET UP BUFFER AND ATTRIBUTES
var vPosition;
var vBuffer;
var vOutlineBuffer;
var vAxisBuffer;   // TODO: MUST SET UP BUFFER AND ATTRIBUTES IN INIT()

// INITIALIZE MISCELLANEOUS VARIABLES 
var currentFOV = 50;   // adjust this later for narrow or width FOV
var currDegrees = 0;  // indicate current degree for the azimuth of the camera heading

window.onload = function init()   // this is like int main() in C
{
    // SET UP WEBGL 
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );  
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height); 
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    // LOAD SHADERS AND INITIALIZE ATTRIBUTE BUFFERS
    program = initShaders( gl, "vertex-shader", "fragment-shader" );  // compile and link shaders, then return a pointer to the program
    gl.useProgram( program ); 

    // populate the points and normals array
    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // spin
     thetaLoc = gl.getUniformLocation(program, "theta"); 

    // SET VALUES FOR UNIFORMS FOR SHADERS
    modelTransformMatrixLoc = gl.getUniformLocation(program, "modelTransformMatrix"); 
    cameraTransformMatrixLoc = gl.getUniformLocation(program, "cameraTransformMatrix"); 
    perspectiveMatrixLoc = gl.getUniformLocation(program, "perspectiveMatrix");
    // currentColourLoc = gl.getUniformLocation(program, "currentColour");

    // INITIALIZE THE TRANSFORMATION MATRICES    
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(modelTransformMatrix)); 

    // apply camera transformations
    // want to move camera in the +z direction since you are looking down the -z axis
    // in reality, since we are taking the inverse matrix, we are moving all the objects in the -z direction
    cameraTransformMatrix = mult(cameraTransformMatrix, translate(0, 0, -10));
    gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
    resetCameraTransformMatrix = cameraTransformMatrix;  // save the original value so we can reset the camera transform later

    // apply symmetric perspective projection
    perspectiveMatrix = perspective(currentFOV, 1, 1, 100);
    // perspectiveMatrix =  ortho(-1, 1, -1, 1, -100, 100);
    gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
    resetPerspectiveMatrix = perspectiveMatrix;  // save the original value of the perspective matrix so we can reset it later for the cross hairs

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );  
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);

    // ADD EVENT LISTENERS
    // for ASCII character keys
    addEventListener("keypress", function(event) {
        switch (event.keyCode) {
            case 99:  // ’c’ key
                console.log("c key");
                ++colourIndexOffset;
                if (colourIndexOffset == 8) {
                    colourIndexOffset = 0;
                }
                break;
            case 105:  // 'i' key
                console.log("i key");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0.25*Math.sin(radians(currDegrees)), 0, -0.25*Math.cos(radians(currDegrees)))));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            case 106:  // 'j' key
                console.log("j key");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(-0.25*Math.cos(radians(currDegrees)), 0, -0.25*Math.sin(radians(currDegrees)))));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            case 107:  // 'k' key
                console.log("k key");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0.25*Math.cos(radians(currDegrees)), 0, 0.25*Math.sin(radians(currDegrees)))));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            case 109:  // 'm' key
                console.log("m key");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(-0.25*Math.sin(radians(currDegrees)), 0, 0.25*Math.cos(radians(currDegrees)))));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            case 114:  // 'r' key
                console.log("r key");
                cameraTransformMatrix = resetCameraTransformMatrix;
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                perspectiveMatrix = resetPerspectiveMatrix;
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                currentFOV = 50;
                currDegrees = 0;
                break;
            case 110:  // 'n' key 
                console.log("n key");
                // change the FOV of the projection but keep the correct heading
                perspectiveMatrix = mult(perspective(--currentFOV, 1, 1, 100), quarternionRotate(-1*currDegrees, vec3(0, 1, 0)));
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                break;
            case 119:  // 'w' key
                console.log("w key");
                perspectiveMatrix = mult(perspective(++currentFOV, 1, 1, 100), quarternionRotate(-1*currDegrees, vec3(0, 1, 0)));
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                break; 
        }
    });

    // for UP, DOWN, LEFT, RIGHT keys (no ASCII code since they are physical keys)
    addEventListener("keydown", function(event) {
        switch(event.keyCode) {
            // rotate the heading/azimuth left by 4 degrees
            case 37:  // LEFT key 
                // currDegrees has opposite sign of rotation degree because we are facing in opposite direction to rotation
                currDegrees -= 4;
                console.log("LEFT");
                perspectiveMatrix = mult(perspectiveMatrix, quarternionRotate(4, vec3(0, 1, 0)));
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                break;
            // move position of the Y-axis up by 0.25 units
            case 38:  // UP key
                console.log("UP");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0, 0.25, 0)));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            // rotate the heading/azimuth right by 4 degrees
            case 39:  // RIGHT key
                currDegrees += 4;
                console.log("RIGHT");
                perspectiveMatrix = mult(perspectiveMatrix, quarternionRotate(-4, vec3(0, 1, 0)));
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                break;
            // move position of the Y-axis down by 0.25 units
            case 40:  // DOWN key
                console.log("DOWN");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0, -0.25, 0)));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
        }
    });

    // start drawing cubes and repeatedly call this function
    render(0);
}

function quarternionRotate(angle, axis) {
    // ignore the 4th element of the axis vector when normalizing
    var unitRotationAxis = normalize(vec4(axis[0], axis[1], axis[2], 1.0), 1);
    var angleRad = radians(angle);

    // compute w, x, y, z for the quarternion
    var w = Math.cos(angleRad/2);
    var x = Math.sin(angleRad/2) * unitRotationAxis[0];
    var y = Math.sin(angleRad/2) * unitRotationAxis[1];
    var z = Math.sin(angleRad/2) * unitRotationAxis[2];

    // compute the result for the rotation by quarternions
    var result = mat4(
        vec4( 1 - 2*(Math.pow(y, 2) + Math.pow(z, 2)), 2*(x*y - w*z), 2*(x*z + w*y), 0.0 ),
        vec4( 2*(x*y + w*z), 1 - 2*(Math.pow(x,2) + Math.pow(z, 2)), 2*(y*z - w*x), 0.0 ),
        vec4( 2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(Math.pow(x,2) + Math.pow(y,2)),   0.0 ),
        vec4( 0.0, 0.0, 0.0, 1.0 )
    );
    // must return inverse so that rotation goes in the correct direction
    return inverse(result);
}

function render(timeStamp) 
{
    // clear colour buffer and depth buffer
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 2.0;
            
    modelTransformMatrix = mat4();
    modelTransformMatrix = mult(modelTransformMatrix, rotate(theta[xAxis], [1, 0, 0] ));
    modelTransformMatrix = mult(modelTransformMatrix, rotate(theta[yAxis], [0, 1, 0] ));
    modelTransformMatrix = mult(modelTransformMatrix, rotate(theta[zAxis], [0, 0, 1] ));
    
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelTransformMatrix"), false, flatten(modelTransformMatrix) );

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );


    // // draw one rectangle by streching a cube in the y-axis
    // // apply the correct matrix transformation to the points for each cube, then draw cube and outline 
    // gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(mult(modelTransformMatrix, scalem(1, 5, 1))));
    // // draw the outline
    // drawOutline();
    // // change the colour for the cube
    // gl.uniform4fv(currentColourLoc, colors[7]); 
    // // draw the cube 
    // drawCube();

    // // draw all 8 cubes and outlines 
    // for (var i = 0; i < 8; i++) {
    //     // order of transformations: rotate, scale, then translate (since you read from to top to get matrix transformation order)
    //     tempModelTransform = mult(modelTransformMatrix, translate(cubeCenters[i][0], cubeCenters[i][1], cubeCenters[i][2]));
    //     scaleAndRotateCube();
    //     // apply the correct matrix transformation to the points for each cube, then draw cube and outline 
    //     gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform));
    //     // draw the outline
    //     drawOutline();
    //     // change the colour for the cube
    //     gl.uniform4fv(currentColourLoc, colors[(colourIndexOffset + i) % 8]); 
    //     // draw the cube 
    //     drawCube();
    // }

    // render again (repeatedly as long as program is running)
    requestAnimationFrame( render );
}