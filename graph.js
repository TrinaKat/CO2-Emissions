/*      Variable Declarations       */

// Global variables
var canvas;
var gl;
var program;

// Data storage/points
var vertices = [];
var colors = [];
var points = [];
var axisPoints = [];
var signPoints = [];

// Uniforms
var vPosition;
var color;

// Buffers
var vertexBuffer;
var colorBuffer;
var axisBuffer;
var outlineBuffer;
var signBuffer;

// Matrices
var model_matrix;
var projection_matrix;
var ortho_matrix;

// Transformations
var fov = 45;
var aspect = 1;     // Aspect ratio, horizontal FOV
var degrees = 0;    // Degrees to rotate heading
var rad = 0;

// Position (8, 5, 30)
var x = -8;      // X-axis displacement from origin
var y = -7;      // Y-axis displacement from origin
var z = -30;     // Z-axis displacement from origin

// Static Initial Position (for reset)
var x0 = -8;      // X-axis displacement from origin
var y0 = -7;      // Y-axis displacement from origin
var z0 = -30;     // Z-axis displacement from origin


// Data
var maxAxisVal = 17000000.0;
var scaleVal = 1.0;
var numBar = 1;
var posHoriz = 0;
var zVal = 0.0;
var colVal = 4;

var CO2_1960 = [];
var CO2_2013 = [];
var CO2_world = [];

// Lighting
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
var normalsArray = [];


window.onload = function init() {

  // Setup WebGL canvas
  canvas = document.getElementById( "gl-canvas" );
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl )
    {
        alert( "WebGL isn't available" );
    }

    // Key presses
    document.onkeydown = function(event)
    {
        // Stack overflow said to
        // Use value of event if available, else use window.event
        event = event || window.event;

        var key = event.keyCode;

        if( key === 38 )       // 'Up' = Move camera up 0.25 units (+Y)
        {
            y -= 0.25;
        }
        else if( key === 40 )       // 'Down' = Move camera down 0.25 units (-Y)
        {
            y += 0.25;
        }

        //Move relative to current heading
        else if( key === 73 )       // 'i' = Move camera position relative to current heading forward by 0.25 unit
        {
            // z += 0.25;

            // Convert degrees to radians
            rad = radians( degrees );

            x += 0.25 * Math.sin( rad );
            z += 0.25 * Math.cos( rad );
        }
        else if( key === 74 )       // 'j' = Move camera position relative to current heading left by 0.25 units
        {
            // x += 0.25;

            // Convert degrees to radians
            rad = radians( degrees );

            x += 0.25 * Math.cos( rad );
            z -= 0.25 * Math.sin( rad );
        }
        else if( key === 75 )       // 'k' = Move camera position relative to current heading right by 0.25 units
        {
            // x -= 0.25;

            // Convert degrees to radians
            rad = radians( degrees );

            x -= 0.25 * Math.cos( rad );
            z += 0.25 * Math.sin( rad );
        }
        else if( key === 77 )       // 'm' = Move camera position relative to current heading backward by 0.25 units
        {
            // z -= 0.25;

            // Convert degrees to radians
            rad = radians( degrees );

            x -= 0.25 * Math.sin( rad );
            z -= 0.25 * Math.cos( rad );
        }

        // Rotates clockwise
        else if( key === 37 )       // 'Left' = Control heading/twisting of camera by 4 degrees to the left
        {
            degrees += 1;
            degrees = degrees % 360;
        }
        // Rotates counterclockwise
        else if( key === 39 )       // 'Right' = Control heading/twisting of camera by 4 degrees to the right
        {
            degrees -= 1;
            degrees = degrees % 360;
        }

        else if( key === 82 )       // 'r' = Reset view to starting position
        {
            x = x0;
            y = y0;
            z = z0;
            fov = 45;
            degrees = 0;
        }

        // FOV = 45 to start
        else if( key === 78 )       // 'n' = Make horizontal FOV narrower by one degree (maintain square display)
        {
            fov--;
        }
        else if( key === 87 )       // 'w' = Make horizontal FOV wider by one degree (maintain square display)
        {
            fov++;
        }
    }


    // Set the viewport, tell WebGL how to convert from clip space to pixels
    gl.viewport( 0, 0, canvas.width, canvas.height );
    // Clear/set the canvas background to white
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    // Enable Z buffer/depth
    gl.enable( gl.DEPTH_TEST );
    // Make things closer or equidistant be drawn
    gl.depthFunc( gl.LEQUAL );

    // Vertices for a single unit cube
    // Length of sides is 0.5 + 0.5 = 1 unit
    vertices = [
        vec4( 0.0, 0.0, 0.0, 1.0 ),
        vec4( 0.0, 1.0, 0.0, 1.0 ),
        vec4( 1.0, 1.0, 0.0, 1.0 ),
        vec4( 1.0, 0.0, 0.0, 1.0 ),
        vec4( 0.0, 0.0, 1.0, 1.0 ),
        vec4( 0.0, 1.0, 1.0, 1.0 ),
        vec4( 1.0, 1.0, 1.0, 1.0 ),
        vec4( 1.0, 0.0, 1.0, 1.0 )
    ];

    // 8 colors for 8 cubes
    colors = [
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 0.5, 0.0, 1.0 ],  // orange
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 0.6, 0.0, 0.6, 1.0 ],  // purple
        [ 1.0, 0.1, 0.5, 1.0 ]   // pink
    ];

    // Yearly CO2 emissions in kt

    CO2_1960 = [
        467833.2613,    // Central Europe and the Baltics
        1210055.796,    // East Asia & Pacific
        2360289.221,    // European Union
        291246.843,     // Latin America & Caribbean
        102252.4647,    // Middle East & North Africa
        3083748.982,    // North America
        139487.6917,    // South Asia
        126041.859      // Sub-Saharan Africa
    ];

    CO2_2013 = [
        658200.831,     // Central Europe and the Baltics
        14264636.57,    // East Asia & Pacific
        3411318.425,    // European Union
        1882589.413,    // Latin America & Caribbean
        2441099.898,    // Middle East & North Africa
        5662266.038,    // North America
        2302798.993,    // South Asia
        784257.123      // Sub-Saharan Africa
    ];

    CO2_world = [
        9385792.843, 9419463.237, 9808656.615, 10347089.56, 10939720.76,    // 1960 - 1964
        11426753.37, 11993620.23, 12378853.25, 13011678.44, 13792038.04,    // 1965 - 1969
        14789733.4, 15350300.36, 15952667.44, 16834514.94, 16952269.64,     // 1970 - 1974
        16853249.64, 17835998.31, 18393371.31, 18606020.64, 19643807.31,    // 1975 - 1979
        19438422.3, 18840587.63, 18679191.95, 18609452.95, 19280447.94,     // 1980 - 1984
        19863328.59, 20471999.26, 20992676.59, 21766336.58, 22242859.56,    // 1985 - 1989
        22352939.23, 22627491.19, 22403367.82, 22381538.17, 22760830.65,    // 1990 - 1994
        23258105.18, 23796153.09, 24155273.4, 24095857, 24051853,           // 1995 - 1999
        24667909, 25250962, 25470982, 27014789, 28364245,                   // 2000 - 2004
        29427675, 30461769, 31125496, 32042246, 31686547,                   // 2005 - 2009
        33505379, 34865836, 35463557, 35848592                              // 2010 - 2013
    ];


    // Load shaders and initialize attribute buffers

    // Compile and link shaders, then return a pointer to the program
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    // Tell it to use our program/shaders
    gl.useProgram( program );

    cubePoints();

    // Create and store data into the normals buffer
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    // Create and store data into vertex buffer
    // Create an empty buffer object to store the vertex buffer
    vertexBuffer = gl.createBuffer();
    // Bind = choose, take the current buffer and bind vertexBuffer
    // Bind appropriate array buffer to it
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    // Pass the vertex data to the buffer from vertices array
    // Points goes to vertexBuffer, and static_draw is optimization thing where we say it's static
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    // Gets information from the program about vPosition from the html shaders
    // Get the attribute location
    vPosition = gl.getAttribLocation( program, "vPosition" );
    // Point an attribute to the currently bound vertex buffer
    // Position Attribute Location, size (components per iteration), type (gl.FLOAT = 32 bit floats), normalize, stride, offset
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    // Enable the attribute
    gl.enableVertexAttribArray( vPosition );

    // Set uniform color and transformation matrix
    color = gl.getUniformLocation(program, "color");
    model_matrix = gl.getUniformLocation(program, "model_matrix");

    // Draw the primitives
  render();
};

function render()
{
    // Affects horizontal FOV
    // perspective: function(fieldOfViewInRadians, aspect, near, far)
    projection_matrix = perspective( fov, aspect, 1, 100 );

    // Control heading/rotation
    projection_matrix = mult( projection_matrix, rotateY( degrees ));

    // function ortho( left, right, bottom, top, near, far )
    ortho_matrix = ortho( -1.0, 1.0, -1.0, 1.0, -1.0, 1.0 );

    // Clear the color buffer and depth buffer
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    drawAxes();

    for ( var i = 1; i <= CO2_1960.length; i++ )
    {
        drawRectPrism( i, CO2_1960[ i - 1 ], false );
        drawRectPrism( i, CO2_2013[ i - 1 ], true );
    }


    /*drawRectPrism( 1, 250000 );
    drawRectPrism( 2, 1000000 );
    drawRectPrism( 3, 14500000 );*/

    drawSign();

    window.requestAnimFrame(render);
}

function cubePoints()
{
    // RHR traversal from vertex 1 to 0 to 3 to 2, only colors one side
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

// Called for each of the 8 cubes for each face
function quad( a, b, c, d )
{
    // var indices = [ a, b, c, a, c, d ];

    // for ( var i = 0; i < indices.length; i++ )
    //     {
    //         points.push( vertices[indices[i]]);
    //     }
     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);


     points.push(vertices[a]); 
     normalsArray.push(normal); 
     points.push(vertices[b]); 
     normalsArray.push(normal); 
     points.push(vertices[c]); 
     normalsArray.push(normal);   
     points.push(vertices[a]);  
     normalsArray.push(normal); 
     points.push(vertices[c]); 
     normalsArray.push(normal); 
     points.push(vertices[d]); 
     normalsArray.push(normal);    
}

function drawRectPrism( numBar, dataVal, recent )
{
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    gl.vertexAttribPointer( gl.getAttribLocation( program, "vPosition" ), 4, gl.FLOAT, false, 0, 0 );
    var transformMatrix = mat4();

    transformMatrix = mult( transformMatrix, projection_matrix );
    transformMatrix = mult(transformMatrix, translate( vec3( x, y, z )));

    scaleVal = 13 * ( dataVal / maxAxisVal );
    transformMatrix = mult( transformMatrix, scalem( 1.0, scaleVal, 1.0 ));

    posHoriz = 2 * numBar - 1;

    if ( recent )
    {
        zVal = 0.0;
        colVal = 4;
    }
    else
    {
        zVal = 1.0;
        colVal = 6;
    }

    transformMatrix = mult( transformMatrix, translate( posHoriz, 0.0, zVal ));

    gl.uniform4fv( color, flatten( colors[ colVal ] ));
    gl.uniformMatrix4fv( model_matrix, false, flatten( transformMatrix ));

    // Draw the array (Triangles or Triangle_strip)
    gl.drawArrays( gl.TRIANGLES, 0, 36 );

    outlineCube( scaleVal, posHoriz, zVal );
}

function outlineCube( scaleVal, posHoriz, zVal )
{
    outlinePoints = [
        vec3( 1.0, 1.0, 1.0 ),
        vec3( 1.0, 0.0, 1.0 ),

        vec3( 1.0, 0.0, 1.0 ),
        vec3( 0.0, 0.0, 1.0 ),

        vec3( 0.0, 0.0, 1.0 ),
        vec3( 0.0, 1.0, 1.0 ),

        vec3( 0.0, 1.0, 1.0 ),
        vec3( 1.0, 1.0, 1.0 ),



        vec3( 1.0, 1.0, 1.0 ),
        vec3( 1.0, 1.0, 0.0 ),

        vec3( 1.0, 0.0, 1.0 ),
        vec3( 1.0, 0.0, 0.0 ),

        vec3( 0.0, 1.0, 1.0 ),
        vec3( 0.0, 1.0, 0.0 ),

        vec3( 0.0, 0.0, 1.0 ),
        vec3( 0.0, 0.0, 0.0 ),



        vec3( 1.0, 1.0, 0.0 ),
        vec3( 1.0, 0.0, 0.0 ),

        vec3( 1.0, 0.0, 0.0 ),
        vec3( 0.0, 0.0, 0.0 ),

        vec3( 0.0, 0.0, 0.0 ),
        vec3( 0.0, 1.0, 0.0 ),

        vec3( 0.0, 1.0, 0.0 ),
        vec3( 1.0, 1.0, 0.0 )
    ];

    // Create and bind buffer
    outlineBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, outlineBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten( outlinePoints ), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    // Initialize transformation matrix so outline transforms with cubes
    var transformMatrix = mat4();
    transformMatrix = mult( transformMatrix, projection_matrix );
    transformMatrix = mult(transformMatrix, translate( vec3( x, y, z )));

    transformMatrix = mult( transformMatrix, scalem( 1.0, scaleVal, 1.0 ));
    transformMatrix = mult( transformMatrix, translate( posHoriz, 0.0, zVal ));


    gl.uniform4fv( color, flatten( vec4( 1.0, 1.0, 1.0, 1.0 )));
    gl.uniformMatrix4fv( model_matrix, false, flatten( transformMatrix ));

    gl.drawArrays( gl.LINES, 0, 24 );
}

function drawSign()
{
    signPoints = [
        vec2( -0.5, -0.5 ),
        vec2( -0.5,  0.5 ),
        vec2(  0.5, -0.5 ),
        vec2(  0.5, -0.5 ),
        vec2(  0.5,  0.5 ),
        vec2( -0.5,  0.5 )
    ];

    signBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, signBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten( signPoints ), gl.STATIC_DRAW );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );

    var transformMatrix = mat4();
    transformMatrix = mult( transformMatrix, ortho_matrix );
    transformMatrix = mult( transformMatrix, scalem( vec3( 0.2, 0.2, 0.2 )));
    transformMatrix = mult( transformMatrix, translate( 4, -4, 0 ));

    gl.uniform4fv(color, flatten(vec4(1.0, 1.0, 1.0, 1.0)));

    // Apply the transformation matrix
    gl.uniformMatrix4fv(model_matrix, false, flatten(transformMatrix));

    // Draw the lines
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawAxes()
{
    // Create unit cross with 4 vertices (0.5 + 0.5 = 1)
    axisPoints = [
        vec3( 0.0, 0.0, 0.0 ),
        vec3( 19.0, 0.0, 0.0 ),
        vec3( 0.0, 0.0, 0.0 ),
        vec3( 0.0, 13.0, 0.0 ),
        vec3( 0.0, 0.0, 0.0 ),
        vec3( 0.0, 0.0, 8.0 )
    ];

    // Create empty crosshair buffer
    axisBuffer = gl.createBuffer();
    // Bind array buffer to crosshairBuffer
    gl.bindBuffer( gl.ARRAY_BUFFER, axisBuffer );
    // Pass the crosshair vertices to buffer
    gl.bufferData( gl.ARRAY_BUFFER, flatten(axisPoints), gl.STATIC_DRAW );

    // Point an attribute to currently bound buffer
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    // Transform/scale crosshairs and project them orthographically
    // Initialize transformation matrix
    var transformMatrix = mat4();
    transformMatrix = mult( transformMatrix, projection_matrix );
    transformMatrix = mult( transformMatrix, translate( vec3( x, y, z )));
    //transformMatrix = mult( transformMatrix, ortho_matrix );
    //transformMatrix = mult( transformMatrix, scalem( vec3( 0.1, 0.1, 0.1 )));

    // Make the crosshairs white
    gl.uniform4fv(color, flatten(vec4(1.0, 1.0, 1.0, 1.0)));

    // Apply the transformation matrix
    gl.uniformMatrix4fv(model_matrix, false, flatten(transformMatrix));

    // Draw the lines
    gl.drawArrays(gl.LINES, 0, 6);

    // Make sure the cube buffer is bound
    // gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    // gl.vertexAttribPointer( gl.getAttribLocation( program, "vPosition" ), 4, gl.FLOAT, false, 0, 0 );

}