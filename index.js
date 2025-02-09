"use strict";

const normalize = (v) => {
  const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
  return [v[0] / len, v[1] / len, v[2] / len];
};

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const rotateVertices = (vertices, angle, axis) => {
  let rotated = [];
  let cosA = Math.cos(angle);
  let sinA = Math.sin(angle);
  let [x, y, z] = axis;

  // 旋转矩阵（Rodrigues' 旋转公式）
  let rotationMatrix = [
    cosA + (1 - cosA) * x * x, (1 - cosA) * x * y - sinA * z, (1 - cosA) * x * z + sinA * y,
    (1 - cosA) * y * x + sinA * z, cosA + (1 - cosA) * y * y, (1 - cosA) * y * z - sinA * x,
    (1 - cosA) * z * x - sinA * y, (1 - cosA) * z * y + sinA * x, cosA + (1 - cosA) * z * z
  ];

  for (let i = 0; i < vertices.length; i += 9) {
    let v = [vertices[i], vertices[i + 1], vertices[i + 2]]; // 取出顶点坐标 (x, y, z)
    
    let xNew = rotationMatrix[0] * v[0] + rotationMatrix[1] * v[1] + rotationMatrix[2] * v[2];
    let yNew = rotationMatrix[3] * v[0] + rotationMatrix[4] * v[1] + rotationMatrix[5] * v[2];
    let zNew = rotationMatrix[6] * v[0] + rotationMatrix[7] * v[1] + rotationMatrix[8] * v[2];

    rotated.push(xNew, yNew, zNew, ...vertices.slice(i + 3, i + 9)); // 复制法线、颜色等信息
  }

  return rotated;
};

// prettier-ignore
const cylinder = (radius = 0.1, height = 6.0, segment = 24) => {
  // // init
  // let radius = 0.1,
  //   height = 6.0,
  //   segment = 24;

  const angleStep = (Math.PI * 2) / segment;
  const angleStep2 = Math.PI / 2 / (segment / 2);

  let vertices = [];
  // let indices = []

  // // Logic-1: Generate circle (base)
  // for (let i = 0; i <= segment; i++) {
  //   let angle1 = i * angleStep,
  //     angle2 = (i + 1) * angleStep,
  //     x1 = radius * Math.cos(angle1),
  //     y1 = radius * Math.sin(angle1),
  //     x2 = radius * Math.cos(angle2),
  //     y2 = radius * Math.sin(angle2);

  //   vertices.push(0, 0, -height / 2, 0.0, 0.0, -1.0, 1.0, 0.0, 0.0);
  //   vertices.push(x1, y1, -height / 2, 0.0, 0.0, -1.0, 1.0, 1.0, 0.0);
  //   vertices.push(x2, y2, -height / 2, 0.0, 0.0, -1.0, 1.0, 1.0, 0.0);
  // }

  // Logic-1: Generate hemisphere (base)
  for (let i = 0; i < segment / 2; i++) {
    let phi1 = i * angleStep2,
      phi2 = (i + 1) * angleStep2;

    let z1 = -radius * Math.cos(phi1) - height / 2,
      z2 = -radius * Math.cos(phi2) - height / 2;

    let r1 = radius * Math.sin(phi1),
      r2 = radius * Math.sin(phi2);

    for (let j = 0; j <= segment; j++) {
      let theta = j * angleStep,
        x1 = r1 * Math.cos(theta),
        y1 = r1 * Math.sin(theta),
        x2 = r2 * Math.cos(theta),
        y2 = r2 * Math.sin(theta);

      let n1 = normalize([x1, y1, z1]),
        n2 = normalize([x2, y2, z2]);

      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 0.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), r1 * Math.sin(theta + angleStep), z1, n1[0], n1[1], n1[2], 1.0, 1.0, 0.0);

      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), r1 * Math.sin(theta + angleStep), z1, n1[0], n1[1], n1[2], 1.0, 1.0, 0.0);
      vertices.push(r2 * Math.cos(theta + angleStep), r2 * Math.sin(theta + angleStep), z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0);
    }
  }

  // // Logic-2: Generate circle (top)
  // for (let i = 0; i <= segment; i++) {
  //   let angle1 = i * angleStep,
  //     angle2 = (i + 1) * angleStep,
  //     x1 = radius * Math.cos(angle1),
  //     y1 = radius * Math.sin(angle1),
  //     x2 = radius * Math.cos(angle2),
  //     y2 = radius * Math.sin(angle2);

  //   vertices.push(0, 0, height / 2, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0); // Vertex (center of circle)
  //   vertices.push(x1, y1, height / 2, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0); // Vertex (circle edge)
  //   vertices.push(x2, y2, height / 2, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0); // Vertex (circle edge)
  // }

  // Logic-2: Generate hemisphere (top)
  for (let i = 0; i < segment / 2; i++) {
    let phi1 = Math.PI + i * angleStep2,
      phi2 = Math.PI + (i + 1) * angleStep2;

    let z1 = -radius * Math.cos(phi1) + height / 2,
      z2 = -radius * Math.cos(phi2) + height / 2;

    let r1 = radius * Math.sin(phi1),
      r2 = radius * Math.sin(phi2);

    for (let j = 0; j <= segment; j++) {
      let theta = j * angleStep,
        x1 = r1 * Math.cos(theta),
        y1 = r1 * Math.sin(theta),
        x2 = r2 * Math.cos(theta),
        y2 = r2 * Math.sin(theta);

      let n1 = normalize([x1, y1, z1]),
        n2 = normalize([x2, y2, z2]);

      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.5, 0.5);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.5, 0.5, 1.0);
      vertices.push(
        r1 * Math.cos(theta + angleStep),
        r1 * Math.sin(theta + angleStep),
        z1,
        n1[0],
        n1[1],
        n1[2],
        1.0,
        0.5,
        0.5
      );

      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.5, 0.5, 1.0);
      vertices.push(
        r1 * Math.cos(theta + angleStep),
        r1 * Math.sin(theta + angleStep),
        z1,
        n1[0],
        n1[1],
        n1[2],
        1.0,
        0.5,
        0.5
      );
      vertices.push(
        r2 * Math.cos(theta + angleStep),
        r2 * Math.sin(theta + angleStep),
        z2,
        n2[0],
        n2[1],
        n2[2],
        0.5,
        0.5,
        1.0
      );
    }
  }

  // Logic-3: Cylindrical (side)
  for (let i = 0; i <= segment; i++) {
    let angle1 = i * angleStep,
      angle2 = (i + 1) * angleStep,
      x1 = radius * Math.cos(angle1),
      y1 = radius * Math.sin(angle1),
      x2 = radius * Math.cos(angle2),
      y2 = radius * Math.sin(angle2);

    // Calculate normal line
    let nx1 = x1,
      ny1 = y1,
      nx2 = x2,
      ny2 = y2;

    // Logic-3-1: Triangle1 (A, B, C)
    vertices.push(x1, y1, -height / 2, nx1, ny1, 0, 1.0, 0.0, 1.0);
    vertices.push(x1, y1, height / 2, nx1, ny1, 0, 0.0, 0.0, 1.0);
    vertices.push(x2, y2, height / 2, nx2, ny2, 0, 1.0, 1.0, 0.0);

    // Logic-3-2: Triangle2 (A, C, D)
    vertices.push(x1, y1, -height / 2, nx1, ny1, 0, 1.0, 0.0, 1.0);
    vertices.push(x2, y2, height / 2, nx2, ny2, 0, 1.0, 1.0, 0.0);
    vertices.push(x2, y2, -height / 2, nx2, ny2, 0, 0.0, 1.0, 0.0);
  }

  return vertices;
};

const torus = (R = 1.0, r = 0.1, segmentMain = 24, segmentTube = 24) => {
  const angleStepMain = (Math.PI * 2) / segmentMain; // 主环角度步进
  const angleStepTube = (Math.PI * 2) / segmentTube; // 截面角度步进

  let vertices = [];

  for (let i = 0; i < segmentMain; i++) {
    let theta1 = i * angleStepMain;
    let theta2 = (i + 1) * angleStepMain;

    for (let j = 0; j <= segmentTube; j++) {
      let phi1 = j * angleStepTube;
      let phi2 = (j + 1) * angleStepTube;

      // 计算第一点 (theta1, phi1)
      let x1 = (R + r * Math.cos(phi1)) * Math.cos(theta1);
      let y1 = (R + r * Math.cos(phi1)) * Math.sin(theta1);
      let z1 = r * Math.sin(phi1);

      // 计算第二点 (theta2, phi1)
      let x2 = (R + r * Math.cos(phi1)) * Math.cos(theta2);
      let y2 = (R + r * Math.cos(phi1)) * Math.sin(theta2);
      let z2 = r * Math.sin(phi1);

      // 计算第三点 (theta2, phi2)
      let x3 = (R + r * Math.cos(phi2)) * Math.cos(theta2);
      let y3 = (R + r * Math.cos(phi2)) * Math.sin(theta2);
      let z3 = r * Math.sin(phi2);

      // 计算第四点 (theta1, phi2)
      let x4 = (R + r * Math.cos(phi2)) * Math.cos(theta1);
      let y4 = (R + r * Math.cos(phi2)) * Math.sin(theta1);
      let z4 = r * Math.sin(phi2);

      // 计算法线
      let n1 = normalize([
        x1 - R * Math.cos(theta1),
        y1 - R * Math.sin(theta1),
        z1,
      ]);
      let n2 = normalize([
        x2 - R * Math.cos(theta2),
        y2 - R * Math.sin(theta2),
        z2,
      ]);
      let n3 = normalize([
        x3 - R * Math.cos(theta2),
        y3 - R * Math.sin(theta2),
        z3,
      ]);
      let n4 = normalize([
        x4 - R * Math.cos(theta1),
        y4 - R * Math.sin(theta1),
        z4,
      ]);

      // 添加两个三角形 (四个点形成一个四边形)
      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.0, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0);
      vertices.push(x3, y3, z3, n3[0], n3[1], n3[2], 1.0, 1.0, 0.0);

      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.0, 1.0);
      vertices.push(x3, y3, z3, n3[0], n3[1], n3[2], 1.0, 1.0, 0.0);
      vertices.push(x4, y4, z4, n4[0], n4[1], n4[2], 0.0, 1.0, 0.0);
    }
  }

  console.log("Torus Vertex Count:", vertices.length / 9); // 调试信息
  return vertices;
};

const X = () => {
  let segment = 24;
  let cylinderVertices = cylinder(undefined, 2.0, undefined);
  console.log("Original Cylinder Vertex Count:", cylinderVertices.length / 9); // 调试信息

  let rotatedVertices1 = rotateVertices(cylinderVertices, Math.PI / 4, [1, 0, 0]); // 旋转 45°
  let rotatedVertices2 = rotateVertices(cylinderVertices, -Math.PI / 4, [1, 0, 0]); // 旋转 -45°

  console.log("Rotated Cylinder Vertex Count:", rotatedVertices1.length / 9, rotatedVertices2.length / 9); // 调试信息
  return [...rotatedVertices1, ...rotatedVertices2]; // 合并两个旋转后的 cylinder
};

const shaderCode = `
struct DataStruct {
    @builtin(position) pos: vec4f,
    @location(0) normal: vec3f,
    @location(1) colors: vec3f,
}

struct Uniforms {
    projectionMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>, // View matrix (camera position)
    rotationX: f32,
    rotationY: f32,
    padding: vec2<f32> // 16-byte alignment
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(
    @location(0) coords: vec3f, 
    @location(1) normal: vec3f, 
    @location(2) colors: vec3f
) -> DataStruct {
    var outData: DataStruct;

    let cosX = cos(uniforms.rotationX);
    let sinX = sin(uniforms.rotationX);
    let cosY = cos(uniforms.rotationY);
    let sinY = sin(uniforms.rotationY);

    let rotatedX = vec3f(
        coords.x,
        coords.y * cosX - coords.z * sinX,
        coords.y * sinX + coords.z * cosX
    );

    let rotatedY = vec3f(
        rotatedX.x * cosY - rotatedX.z * sinY,
        rotatedX.y,
        rotatedX.x * sinY + rotatedX.z * cosY
    );

    outData.pos = uniforms.projectionMatrix * uniforms.viewMatrix * vec4f(rotatedY, 1.0); // 4D
    outData.normal = normal; //  transmission normal
    outData.colors = colors;
    return outData;
}

@fragment
fn fragmentMain(fragData: DataStruct) -> @location(0) vec4f {
    // let lightDirection = normalize(vec3f(1.0, 1.0, 1.0)); // oblique overhead light source
    // let diffuse = max(dot(fragData.normal, lightDirection), 0.0);
    // return vec4f(fragData.colors * diffuse, 1.0);
    return vec4f(fragData.colors, 1.0);
}
`;

async function runExample() {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No GPUAdapter found");
  }
  const device = await adapter.requestDevice();
  if (!device) {
    throw new Error("Failed to create a GPUDevice");
  }
  const canvas = document.getElementById("canvas_example");
  if (!canvas) {
    throw new Error("Could not access canvas in page");
  }
  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("Could not obtain WebGPU context for canvas");
  }
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
    alphaMode: "premultiplied",
  });

  const vertexData = new Float32Array([...cylinder(), ...torus(), ...X()]);
  console.log("Total Vertex Count:", vertexData.length / 9); // 检查是否包含 X 形状

  //   console.log(vertexData);
  const vertexBuffer = device.createBuffer({
    label: "Cylinder vertex buffer",
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);
  const shaderModule = device.createShaderModule({
    label: "Example shader module",
    code: shaderCode,
  });

  const depthTexture = device.createTexture({
    size: [canvas.clientWidth, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const render = () => {
    const encoder = device.createCommandEncoder();
    if (!encoder) {
      throw new Error("Failed to create a GPUCommandEncoder");
    }
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 1.0 },
          storeOp: "store",
        },
      ],
      // Depth detection to avoid mutual occlusion
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0, // 1.0 = far, 0.0 = near
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.draw(vertexData.length / 9);
    renderPass.end();
    device.queue.submit([encoder.finish()]);
  };

  const createViewMatrix = (eye, center, up) => {
    const f = normalize([
      center[0] - eye[0],
      center[1] - eye[1],
      center[2] - eye[2],
    ]);
    const s = normalize(cross(f, up));
    const u = cross(s, f);

    // prettier-ignore
    return [
      s[0], u[0], -f[0], 0,
      s[1], u[1], -f[1], 0,
      s[2], u[2], -f[2], 0,
      -dot(s, eye), -dot(u, eye), dot(f, eye), 1
    ]
  };

  const eye = [0, 0, 8],
    center = [0, 0, 0],
    up = [0, 1, 0];

  const viewMatrix = createViewMatrix(eye, center, up);

  // const uniformBuffer = device.createBuffer({
  //   size: 8, // rotationX(4) + rotationY(4)
  //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  // });
  // const uniformBuffer = device.createBuffer({
  //   size: 80, // 64 (matrix) + 8 (rotations) + 8 (padding)
  //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  // })
  const uniformBuffer = device.createBuffer({
    size: 64 + 64 + 8 + 8, // Perspective Matrix + View Matrix + Rotation + Padding
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "uniform",
        },
      },
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout], // Explicit binding of laybout
  });

  const renderPipeline = device.createRenderPipeline({
    layout: pipelineLayout, // not "auto"
    vertex: {
      module: shaderModule,
      entryPoint: "vertexMain",
      buffers: [
        {
          arrayStride: 36, // 9 * 4 = 36 bytes per vertex
          attributes: [
            { format: "float32x3", offset: 0, shaderLocation: 0 }, // (x, y, z)
            { format: "float32x3", offset: 12, shaderLocation: 1 }, // (nx, ny, nz)
            { format: "float32x3", offset: 24, shaderLocation: 2 }, // (r, g, b)
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragmentMain",
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    },
  });

  // prettier-ignore
  const createProjectionMatrix = (fov, aspect, near, far) => {
    const f = 1.0 / Math.tan(fov / 2);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ];
  };

  const fov = Math.PI / 4,
    aspect = canvas.width / canvas.height,
    near = 0.1,
    far = 10.0;

  const projectionMatrix = createProjectionMatrix(fov, aspect, near, far);

  let rotationX = 0.0;
  let rotationY = 0.0;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // const updateRotation = () => {
  //   console.log(rotationX, rotationY);
  //   const uniformData = new Float32Array([rotationX, rotationY]);
  //   device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  // };
  // const updateRotation = () => {
  //   const uniformData = new Float32Array([
  //     ...projectionMatrix,
  //     rotationX,
  //     rotationY,
  //     0, 0
  //   ])
  //   device.queue.writeBuffer(uniformBuffer, 0, uniformData)
  // }
  const updateUniforms = () => {
    const uniformData = new Float32Array([
      ...projectionMatrix,
      ...viewMatrix,
      rotationX,
      rotationY,
      0,
      0,
    ]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  };

  document.addEventListener("mousedown", (event) => {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  document.addEventListener("mousemove", (event) => {
    if (isDragging) {
      let deltaX = (event.clientX - lastMouseX) * 0.01; // 旋转比例
      let deltaY = (event.clientY - lastMouseY) * 0.01;

      rotationY += deltaX; // 左右旋转（绕 Y 轴）
      rotationX += deltaY; // 上下旋转（绕 X 轴）

      lastMouseX = event.clientX;
      lastMouseY = event.clientY;

      updateUniforms(); // 更新 GPU uniform
      render();
    }
  });
}
runExample();
