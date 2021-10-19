function WebGLDrawer(canvas, contextAttributes) {
    if (contextAttributes == undefined) {
        contextAttributes = { antialias: true, alpha: true, stencil: true };
    }
    this.ctx = canvas.getContext('webgl', contextAttributes);

    if (this.ctx == null) {
        this.ctx = canvas.getContext('experimental-webgl', contextAttributes);
        if (this.ctx == null) {
            console.log('Get WebGL context failed');
            return null;
        }
    }

    //Initial shader program
    {
        function initShaderProgram(gl, vsSource, fsSource) {
            function loadShader(gl, type, source) {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
                    gl.deleteShader(shader);
                    return null;
                }
                return shader;
            }

            const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
            const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

            const shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
                return null;
            }

            return shaderProgram;
        }

        //Bitmap program
        {
            // Vertex shader program
            const vsSource = `
                precision highp float;
				attribute vec4 aVertexPosition;
				attribute vec2 aTextureCoord;
				uniform mat4 uTransform;
				varying vec2 vTextureCoord;
				
				void main(void) {
				    gl_Position = uTransform * aVertexPosition;
				    vTextureCoord = aTextureCoord;
				}
				`;
            // Fragment shader program
            const fsSource = `
                precision highp float;
				varying vec2 vTextureCoord;
				uniform sampler2D uSampler;

				void main(void) {
				    if (vTextureCoord.x >= 0.0 && vTextureCoord.x <= 1.0 && vTextureCoord.y >= 0.0 && vTextureCoord.y <= 1.0) {
				        gl_FragColor = texture2D(uSampler, vTextureCoord);
				    }
				    else {
				        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
				    }
				}
				`;
            const shaderProgram = initShaderProgram(this.ctx, vsSource, fsSource);
            this.bmpProgramInfo = {
                program: shaderProgram,
                attribLocations: {
                    vertexPosition: this.ctx.getAttribLocation(shaderProgram, 'aVertexPosition'),
                    textureCoord: this.ctx.getAttribLocation(shaderProgram, 'aTextureCoord')
                },
                uniformLocations: {
                    uTransform: this.ctx.getUniformLocation(shaderProgram, 'uTransform'),
                    uSampler: this.ctx.getUniformLocation(shaderProgram, 'uSampler')
                }
            };
        }

        //ROI Program
        {
            const vsSource = `
                precision highp float;
				attribute vec4 aVertexPosition;
				uniform mat4 uTransform;
				void main() {
				    gl_Position = uTransform * aVertexPosition;
                    gl_PointSize = 1.0;
				}
				`;

            const fsSource = `
				precision highp float;
				uniform vec4 uColor;
				void main() {
				    gl_FragColor = uColor;
				}
				`;
            const shaderProgram = initShaderProgram(this.ctx, vsSource, fsSource);
            this.roiProgramInfo = {
                program: shaderProgram,
                attribLocations: {
                    vertexPosition: this.ctx.getAttribLocation(shaderProgram, 'aVertexPosition')
                },
                uniformLocations: {
                    uTransform: this.ctx.getUniformLocation(shaderProgram, 'uTransform'),
                    uColor: this.ctx.getUniformLocation(shaderProgram, 'uColor')
                }
            };
        }
    }

    //Initial standard vertex object
    {
        function initStandardVertexObject(gl) {
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            const positions = [
				-1.0, 1.0,
				1.0, 1.0,
				1.0, -1.0,
                -1.0, -1.0
            ];

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

            const textureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

            const textureCoordinates = [
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0,
            ];

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

            const indices = [
                0, 1, 2, 3
            ];

            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

            return {
                vertexBuffer: positionBuffer,
                vertexType: gl.FLOAT,
                vertexNormalized: false,
                textureCoord: textureCoordBuffer,
                textureCoordType: gl.FLOAT,
                textureNormalized: false,
                elementBuffer: indexBuffer,
                elementType: gl.UNSIGNED_SHORT,
                elementCount: indices.length,
                elementDrawMode: gl.TRIANGLE_FAN
            };
        }
        this.stdVertexObj = initStandardVertexObject(this.ctx);
    }

    //Blend function for alpha color
    {
        this.ctx.enable(this.ctx.BLEND);
        this.ctx.blendFunc(this.ctx.SRC_ALPHA, this.ctx.ONE_MINUS_SRC_ALPHA);
    }
}

WebGLDrawer.prototype.defaultTransformMat = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

WebGLDrawer.prototype.destroy = function () {
    this.ctx.getExtension('WEBGL_lose_context').loseContext();
    this.ctx = null;
};

WebGLDrawer.prototype.createTextureObject = function () {
    const texture = this.ctx.createTexture();
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture);

    this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx.CLAMP_TO_EDGE);
    this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx.CLAMP_TO_EDGE);
    this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MAG_FILTER, this.ctx.LINEAR);
    this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MIN_FILTER, this.ctx.LINEAR);

    return texture;
};

WebGLDrawer.prototype.updateTexture = function (textureObj, source) {
    const level = 0;
    const internalFormat = this.ctx.RGBA;
    const srcFormat = this.ctx.RGBA;
    const srcType = this.ctx.UNSIGNED_BYTE;
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, textureObj);
    this.ctx.texImage2D(this.ctx.TEXTURE_2D, level, internalFormat, srcFormat, srcType, source);
};

WebGLDrawer.prototype.setDrawRegion = function (x, y, width, height) {
    this.ctx.viewport(x, -y + (this.ctx.canvas.height - height), width, height);
};

WebGLDrawer.prototype.setScissor = function (enable, x, y, width, height) {
    if (enable == true) {
        this.ctx.enable(this.ctx.SCISSOR_TEST);
        this.ctx.scissor(x, -y + (this.ctx.canvas.height - height), width, height);
    }
    else {
        this.ctx.disable(this.ctx.SCISSOR_TEST);
    }
};

WebGLDrawer.prototype.setClearColor = function (r, g, b, a) {
    this.ctx.clearColor(r, g, b, a);
};

WebGLDrawer.prototype.clearColorBuffer = function () {
    this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
};

WebGLDrawer.prototype.getMappingTableVerticeObj = function (mappingTable, vertexBuffer, elementsBuffer) {
    const textureCoordBuffer = this.ctx.createBuffer();
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, textureCoordBuffer);
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, mappingTable, this.ctx.DYNAMIC_DRAW);

    const positionBuffer = this.ctx.createBuffer();
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, positionBuffer);
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, vertexBuffer, this.ctx.STATIC_DRAW);

    var ext = this.ctx.getExtension('OES_element_index_uint');
    const indexBuffer = this.ctx.createBuffer();
    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.ctx.bufferData(this.ctx.ELEMENT_ARRAY_BUFFER, elementsBuffer, this.ctx.STATIC_DRAW);

    return {
        vertexBuffer: positionBuffer,
        vertexType: this.ctx.FLOAT,
        vertexNormalized: false,
        textureCoord: textureCoordBuffer,
        textureCoordType: this.ctx.FLOAT,
        textureNormalized: false,
        elementBuffer: indexBuffer,
        elementType: this.ctx.UNSIGNED_INT,
        elementCount: elementsBuffer.length,
        elementDrawMode: this.ctx.TRIANGLE_STRIP
    };
};

WebGLDrawer.prototype.updateMappingTableVerticeObj = function (MappingTableObj, mappingTable) {
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, MappingTableObj.textureCoord);
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, mappingTable, this.ctx.DYNAMIC_DRAW);
};

WebGLDrawer.prototype.drawBitmap = function (textureObj, x, y, width, height, mappingTableObj, trasformMat) {
    const viewPort = this.ctx.getParameter(this.ctx.VIEWPORT);
    this.ctx.viewport(viewPort[0] + x, viewPort[1] + (this.ctx.canvas.height - (y + height)), width, height);
    
    this.ctx.useProgram(this.bmpProgramInfo.program);

    if (trasformMat == undefined || trasformMat == null) {
        trasformMat = this.defaultTransformMat;
    }
    this.ctx.uniformMatrix4fv(this.bmpProgramInfo.uniformLocations.uTransform, false, trasformMat);

    if (mappingTableObj == undefined || mappingTableObj == null) {
        mappingTableObj = this.stdVertexObj;
    }

    //vertex coordinate
    {
        const numComponents = 2;
        const type = mappingTableObj.vertexType;
        const normalize = mappingTableObj.vertexNormalized;
        const stride = 0;
        const offset = 0;
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, mappingTableObj.vertexBuffer);
        this.ctx.vertexAttribPointer(
            this.bmpProgramInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        this.ctx.enableVertexAttribArray(
            this.bmpProgramInfo.attribLocations.vertexPosition);
    }

    //texture coordinate
    {
        const numComponents = 2;
        const type = mappingTableObj.textureCoordType;
        const normalize = mappingTableObj.textureNormalized;
        const stride = 0;
        const offset = 0;
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, mappingTableObj.textureCoord);
        this.ctx.vertexAttribPointer(
            this.bmpProgramInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        this.ctx.enableVertexAttribArray(
            this.bmpProgramInfo.attribLocations.textureCoord);
    }

    this.ctx.activeTexture(this.ctx.TEXTURE0);
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, textureObj);
    this.ctx.uniform1i(this.bmpProgramInfo.uniformLocations.uSampler, 0);

    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, mappingTableObj.elementBuffer);
    this.ctx.drawElements(mappingTableObj.elementDrawMode, mappingTableObj.elementCount, mappingTableObj.elementType, 0);

    this.ctx.viewport(viewPort[0], viewPort[1], viewPort[2], viewPort[3]);
};

WebGLDrawer.prototype.getPolygonObject = function (polygonArray) {
    const vertexBuffer = this.ctx.createBuffer();
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, vertexBuffer);
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, polygonArray.getVertexBuffer(), this.ctx.STATIC_DRAW);

    var fillIndexBuffer = null;
    if (polygonArray.fillIndexSize > 0) {
        fillIndexBuffer = this.ctx.createBuffer();
        var ext = this.ctx.getExtension('OES_element_index_uint');
        this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, fillIndexBuffer);
        this.ctx.bufferData(this.ctx.ELEMENT_ARRAY_BUFFER, polygonArray.getFillIndexBuffer(), this.ctx.STATIC_DRAW);
    }

    var lineVertexBuffer = null;
    var lineElementBuffer = null;
    var lineElementCount = 0;
    if (polygonArray.lineElementSize > 0) {
        lineVertexBuffer = this.ctx.createBuffer();
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, lineVertexBuffer);
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, polygonArray.getLineVertexBuffer(), this.ctx.STATIC_DRAW);

        lineElementBuffer = this.ctx.createBuffer();
        this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, lineElementBuffer);
        this.ctx.bufferData(this.ctx.ELEMENT_ARRAY_BUFFER, polygonArray.getLineElementBuffer(), this.ctx.STATIC_DRAW);
        lineElementCount = polygonArray.lineElementSize;
    }

    return {
        vertexDrawMode: this.ctx.LINE_STRIP,
        vertexBuffer: vertexBuffer,
        vertexCount: polygonArray.vertexSize / 2,
        vertexType: this.ctx.FLOAT,
        vertexDimension: 2,
        vertexNormalized: true,

        fillIndexDrawMode: this.ctx.TRIANGLES,
        fillIndexBuffer: fillIndexBuffer,
        fillIndexCount: polygonArray.fillIndexSize,
        fillIndexType: this.ctx.UNSIGNED_INT,

        lineVertexBuffer: lineVertexBuffer,
        lineVertexDimension: 2,
        lineVertexType: this.ctx.FLOAT,
        lineVertexNormalized: true,

        lineElementDrawMode: this.ctx.TRIANGLES,
        lineElementBuffer: lineElementBuffer,
        lineElementCount: lineElementCount,
        lineElementType: this.ctx.UNSIGNED_INT,
    };
};

WebGLDrawer.prototype.getCircleObject = function (circleArray) {
    const vertexBuffer = this.ctx.createBuffer();
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, vertexBuffer);
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, circleArray.getVertexBuffer(), this.ctx.STATIC_DRAW);

    var fillIndexBuffer = null;
    if (circleArray.fillIndexSize > 0) {
        fillIndexBuffer = this.ctx.createBuffer();
        var ext = this.ctx.getExtension('OES_element_index_uint');
        this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, fillIndexBuffer);
        this.ctx.bufferData(this.ctx.ELEMENT_ARRAY_BUFFER, circleArray.getFillIndexBuffer(), this.ctx.STATIC_DRAW);
    }

    var lineVertexBuffer = null;
    var lineElementBuffer = null;
    var lineElementCount = 0;
    if (circleArray.lineElementSize > 0) {
        lineVertexBuffer = this.ctx.createBuffer();
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, lineVertexBuffer);
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, circleArray.getLineVertexBuffer(), this.ctx.STATIC_DRAW);

        lineElementBuffer = this.ctx.createBuffer();
        this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, lineElementBuffer);
        this.ctx.bufferData(this.ctx.ELEMENT_ARRAY_BUFFER, circleArray.getLineElementBuffer(), this.ctx.STATIC_DRAW);
        lineElementCount = circleArray.lineElementSize;
    }

    return {
        vertexDrawMode: this.ctx.LINE_STRIP,
        vertexBuffer: vertexBuffer,
        vertexCount: circleArray.vertexSize / 2,
        vertexType: this.ctx.FLOAT,
        vertexDimension: 2,
        vertexNormalized: true,

        fillIndexDrawMode: this.ctx.TRIANGLES,
        fillIndexBuffer: fillIndexBuffer,
        fillIndexCount: circleArray.fillIndexSize,
        fillIndexType: this.ctx.UNSIGNED_INT,

        lineVertexBuffer: lineVertexBuffer,
        lineVertexDimension: 2,
        lineVertexType: this.ctx.FLOAT,
        lineVertexNormalized: true,

        lineElementDrawMode: this.ctx.TRIANGLE_STRIP,
        lineElementBuffer: lineElementBuffer,
        lineElementCount: lineElementCount,
        lineElementType: this.ctx.UNSIGNED_INT,
    };
};


WebGLDrawer.prototype.drawROI = function (roiObj, lineColor, filledColor, trasformMat) {
    this.ctx.useProgram(this.roiProgramInfo.program);
	
    if (trasformMat == undefined) {
        trasformMat = this.defaultTransformMat;
    }
    this.ctx.uniformMatrix4fv(this.roiProgramInfo.uniformLocations.uTransform, false, trasformMat);
	
	//Set stencil
	this.ctx.enable(this.ctx.STENCIL_TEST);
	this.ctx.clear(this.ctx.STENCIL_BUFFER_BIT);
	this.ctx.stencilFunc(this.ctx.NOTEQUAL, 1, 0xff);
	this.ctx.stencilOp(this.ctx.KEEP, this.ctx.KEEP, this.ctx.REPLACE);
	{
		//Draw line
		{
			this.ctx.uniform4fv(this.roiProgramInfo.uniformLocations.uColor, lineColor);

			if (roiObj.lineElementCount > 0) {
				//Line vertex
				{
					const numComponents = roiObj.lineVertexDimension;
					const type = roiObj.lineVertexType;
					const normalize = roiObj.lineVertexNormalized;
					const stride = 0;
					const offset = 0;
					this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, roiObj.lineVertexBuffer);
					this.ctx.vertexAttribPointer(
						this.roiProgramInfo.attribLocations.vertexPosition,
						numComponents,
						type,
						normalize,
						stride,
						offset);
					this.ctx.enableVertexAttribArray(
						this.roiProgramInfo.attribLocations.vertexPosition);
				}

				//Draw element
				{
					this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, roiObj.lineElementBuffer);
					this.ctx.drawElements(roiObj.lineElementDrawMode, roiObj.lineElementCount, roiObj.lineElementType, 0);
				}
			}
			else {
				//vertex coordinate
				{
					const numComponents = roiObj.vertexDimension;
					const type = roiObj.vertexType;
					const normalize = roiObj.vertexNormalized;
					const stride = 0;
					const offset = 0;
					this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, roiObj.vertexBuffer);
					this.ctx.vertexAttribPointer(
						this.roiProgramInfo.attribLocations.vertexPosition,
						numComponents,
						type,
						normalize,
						stride,
						offset);
					this.ctx.enableVertexAttribArray(
						this.roiProgramInfo.attribLocations.vertexPosition);
                }
                this.ctx.drawArrays(roiObj.vertexDrawMode, 0, roiObj.vertexCount);
			}
		}

		//Draw filled
		if (roiObj.fillIndexCount > 0) {
			this.ctx.uniform4fv(this.roiProgramInfo.uniformLocations.uColor, filledColor);
			
			//vertex coordinate
			{
				const numComponents = roiObj.vertexDimension;
				const type = roiObj.vertexType;
				const normalize = roiObj.vertexNormalized;
				const stride = 0;
				const offset = 0;
				this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, roiObj.vertexBuffer);
				this.ctx.vertexAttribPointer(
					this.roiProgramInfo.attribLocations.vertexPosition,
					numComponents,
					type,
					normalize,
					stride,
					offset);
				this.ctx.enableVertexAttribArray(
					this.roiProgramInfo.attribLocations.vertexPosition);
			}
			
			this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, roiObj.fillIndexBuffer);
			this.ctx.drawElements(roiObj.fillIndexDrawMode, roiObj.fillIndexCount, roiObj.fillIndexType, 0);
		}
	}
	this.ctx.disable(this.ctx.STENCIL_TEST);
};