"use strict";

// 定义算法
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
    cosA + (1 - cosA) * x * x,
    (1 - cosA) * x * y - sinA * z,
    (1 - cosA) * x * z + sinA * y,
    (1 - cosA) * y * x + sinA * z,
    cosA + (1 - cosA) * y * y,
    (1 - cosA) * y * z - sinA * x,
    (1 - cosA) * z * x - sinA * y,
    (1 - cosA) * z * y + sinA * x,
    cosA + (1 - cosA) * z * z,
  ];

  for (let i = 0; i < vertices.length; i += 10) {
    let v = [vertices[i], vertices[i + 1], vertices[i + 2]]; // 取出顶点坐标 (x, y, z)

    let xNew =
      rotationMatrix[0] * v[0] +
      rotationMatrix[1] * v[1] +
      rotationMatrix[2] * v[2];
    let yNew =
      rotationMatrix[3] * v[0] +
      rotationMatrix[4] * v[1] +
      rotationMatrix[5] * v[2];
    let zNew =
      rotationMatrix[6] * v[0] +
      rotationMatrix[7] * v[1] +
      rotationMatrix[8] * v[2];

    rotated.push(xNew, yNew, zNew, ...vertices.slice(i + 3, i + 10)); // 复制法线、颜色等信息
  }

  return rotated;
};

// 平移矩阵
// prettier-ignore
const createTranslationMatrix = (x, y, z) => {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ])
}

// 旋转矩阵
// prettier-ignore
const createRotationMatrix = (xAngle, yAngle, zAngle) => {
  const cosX = Math.cos(xAngle), sinX = Math.sin(xAngle);
  const cosY = Math.cos(yAngle), sinY = Math.sin(yAngle);
  const cosZ = Math.cos(zAngle), sinZ = Math.sin(zAngle);

  // 绕 X 轴旋转矩阵
  const rotX = [
      1, 0,    0,    0,
      0, cosX, -sinX, 0,
      0, sinX, cosX, 0,
      0, 0,    0,    1
  ];

  // 绕 Y 轴旋转矩阵
  const rotY = [
      cosY, 0, sinY, 0,
      0,    1, 0,    0,
      -sinY, 0, cosY, 0,
      0,    0, 0,    1
  ];

  // 绕 Z 轴旋转矩阵
  const rotZ = [
      cosZ, -sinZ, 0, 0,
      sinZ, cosZ,  0, 0,
      0,    0,     1, 0,
      0,    0,     0, 1
  ];

  // 旋转矩阵 = Rz * Ry * Rx
  return multiplyMatrices(multiplyMatrices(rotZ, rotY), rotX);
};

// 旋转平移合并
// prettier-ignore
const multiplyMatrices = (a, b) => {
  let result = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
          result[i * 4 + j] =
              a[i * 4 + 0] * b[0 * 4 + j] +
              a[i * 4 + 1] * b[1 * 4 + j] +
              a[i * 4 + 2] * b[2 * 4 + j] +
              a[i * 4 + 3] * b[3 * 4 + j];
      }
  }
  return result;
};

// 定义图形
// prettier-ignore
const cylinder = (radius = 0.1, height = 6.0, segment = 24) => {

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

    let y1 = -radius * Math.cos(phi1) - height / 2,
      y2 = -radius * Math.cos(phi2) - height / 2;

    let r1 = radius * Math.sin(phi1),
      r2 = radius * Math.sin(phi2);

    for (let j = 0; j <= segment; j++) {
      let theta = j * angleStep,
        x1 = r1 * Math.cos(theta),
        z1 = r1 * Math.sin(theta),
        x2 = r2 * Math.cos(theta),
        z2 = r2 * Math.sin(theta);

      let n1 = normalize([x1, y1, z1]),
        n2 = normalize([x2, y2, z2]);

      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 0.0, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n1[0], n1[1], n1[2], 1.0, 1.0, 0.0, 1.0);

      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n1[0], n1[1], n1[2], 1.0, 1.0, 0.0, 1.0);
      vertices.push(r2 * Math.cos(theta + angleStep), y2, r2 * Math.sin(theta + angleStep), n2[0], n2[1], n2[2], 0.0, 1.0, 1.0, 1.0);
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

    let y1 = -radius * Math.cos(phi1) + height / 2,
      y2 = -radius * Math.cos(phi2) + height / 2;

    let r1 = radius * Math.sin(phi1),
      r2 = radius * Math.sin(phi2);

    for (let j = 0; j <= segment; j++) {
      let theta = j * angleStep,
        x1 = r1 * Math.cos(theta),
        z1 = r1 * Math.sin(theta),
        x2 = r2 * Math.cos(theta),
        z2 = r2 * Math.sin(theta);

      let n1 = normalize([x1, y1, z1]),
        n2 = normalize([x2, y2, z2]);

      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.5, 0.5, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.5, 0.5, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n1[0], n1[1], n1[2], 1.0, 0.5, 0.5, 1.0);

      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.5, 0.5, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n1[0], n1[1], n1[2], 1.0, 0.5, 0.5, 1.0);
      vertices.push(r2 * Math.cos(theta + angleStep), y2, r2 * Math.sin(theta + angleStep), n2[0], n2[1], n2[2], 0.5, 0.5, 1.0, 1.0);
    }
  }

  // Logic-3: Cylindrical (side)
  for (let i = 0; i <= segment; i++) {
    let angle1 = i * angleStep,
      angle2 = (i + 1) * angleStep,
      x1 = radius * Math.cos(angle1),
      z1 = radius * Math.sin(angle1),
      x2 = radius * Math.cos(angle2),
      z2 = radius * Math.sin(angle2);

    // Calculate normal line
    let nx1 = x1,
      nz1 = z1,
      nx2 = x2,
      nz2 = z2;

    // Logic-3-1: Triangle1 (A, B, C)
    vertices.push(x1, -height / 2, z1, nx1, 0, nz1, 1.0, 0.0, 1.0, 1.0);
    vertices.push(x1, height / 2, z1, nx1, 0, nz1, 0.0, 0.0, 1.0, 1.0);
    vertices.push(x2, height / 2, z2, nx2, 0, nz2, 1.0, 1.0, 0.0, 1.0);

    // Logic-3-2: Triangle2 (A, C, D)
    vertices.push(x1, -height / 2, z1, nx1, 0, nz1, 1.0, 0.0, 1.0, 1.0);
    vertices.push(x2, height / 2, z2, nx2, 0, nz2, 1.0, 1.0, 0.0, 1.0);
    vertices.push(x2, -height / 2, z2, nx2, 0, nz2, 0.0, 1.0, 0.0, 1.0);
  }

  return vertices;
};

const torus = (R = 0.6, r = 0.1, segmentMain = 24, segmentTube = 24) => {
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
      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.0, 1.0, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0, 1.0);
      vertices.push(x3, y3, z3, n3[0], n3[1], n3[2], 1.0, 1.0, 0.0, 1.0);

      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.0, 1.0, 1.0);
      vertices.push(x3, y3, z3, n3[0], n3[1], n3[2], 1.0, 1.0, 0.0, 1.0);
      vertices.push(x4, y4, z4, n4[0], n4[1], n4[2], 0.0, 1.0, 0.0, 1.0);
    }
  }

  console.log("Torus Vertex Count:", vertices.length / 10); // 调试信息
  return vertices;
};

const X = () => {
  let segment = 24;
  let cylinderVertices = cylinder(undefined, 1.6, undefined);
  console.log("Original Cylinder Vertex Count:", cylinderVertices.length / 10); // 调试信息

  let rotatedVertices1 = rotateVertices(
    cylinderVertices,
    Math.PI / 4,
    [0, 0, 1]
  ); // 旋转 45°
  let rotatedVertices2 = rotateVertices(
    cylinderVertices,
    -Math.PI / 4,
    [0, 0, 1]
  ); // 旋转 -45°

  console.log(
    "Rotated Cylinder Vertex Count:",
    rotatedVertices1.length / 10,
    rotatedVertices2.length / 10
  ); // 调试信息
  return [...rotatedVertices1, ...rotatedVertices2]; // 合并两个旋转后的 cylinder
};

// 定义shader
const shaderCode = `
struct DataStruct {
    @builtin(position) pos: vec4f,
    @location(0) normal: vec3f,
    @location(1) colors: vec4f,
}

struct InstanceData {
    modelMatrix: mat4x4<f32>
}

struct Uniforms {
    projectionMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>, // View matrix (camera position)
    rotationX: f32,
    rotationY: f32,
    padding: vec2<f32> // 16-byte alignment
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(1) @binding(0) var<storage, read> instances: array<InstanceData>;

@vertex
fn vertexMain(
    @location(0) coords: vec3f, 
    @location(1) normal: vec3f, 
    @location(2) colors: vec4f,
    @builtin(instance_index) instanceIndex: u32 // GPU自动管理实例索引
) -> DataStruct {
    var outData: DataStruct;

    // let cosX = cos(uniforms.rotationX);
    // let sinX = sin(uniforms.rotationX);
    // let cosY = cos(uniforms.rotationY);
    // let sinY = sin(uniforms.rotationY);

    // let rotatedX = vec3f(
    //     coords.x,
    //     coords.y * cosX - coords.z * sinX,
    //     coords.y * sinX + coords.z * cosX
    // );

    // let rotatedY = vec3f(
    //     rotatedX.x * cosY - rotatedX.z * sinY,
    //     rotatedX.y,
    //     rotatedX.x * sinY + rotatedX.z * cosY
    // );

    // 读取实例变换矩阵
    let modelMatrix = instances[instanceIndex].modelMatrix;
    let worldPosition = modelMatrix * vec4f(coords, 1.0);

    outData.pos = uniforms.projectionMatrix * uniforms.viewMatrix * worldPosition; // 4D
    outData.normal = normal; //  transmission normal
    outData.colors = colors;
    return outData;
}

@fragment
fn fragmentMain(fragData: DataStruct) -> @location(0) vec4f {
    // let lightDirection = normalize(vec3f(1.0, 1.0, 1.0)); // oblique overhead light source
    // let diffuse = max(dot(fragData.normal, lightDirection), 0.0);
    // return vec4f(fragData.colors * diffuse, 1.0);
    return fragData.colors;
}
`;

// 定义图形计算
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
  // 初始化图形画布
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
    alphaMode: "premultiplied",
  });

  // 定义顶点
  const vertexData_lineSegment = new Float32Array([...cylinder()]);
  const vertexData_torus = new Float32Array([...torus()]);
  const vertexData_X = new Float32Array([...X()]);
  console.log(
    "VertexData_lineSegment Count:",
    vertexData_lineSegment.length / 10
  );
  console.log("VertexData_torus Count:", vertexData_torus.length / 10);
  console.log("VertexData_X Count:", vertexData_X.length / 10);
  //   console.log(vertexData);

  // 定义顶点缓冲区
  const vertexBuffer_lineSegment = device.createBuffer({
    label: "lineSegment vertex buffer",
    size: vertexData_lineSegment.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const vertexBuffer_torus = device.createBuffer({
    label: "torus vertex buffer",
    size: vertexData_torus.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const vertexBuffer_X = device.createBuffer({
    label: "X vertex buffer",
    size: vertexData_X.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // for (let i = 0; i < vertexData_X.length; i += 10) {
  //   console.log(
  //     `Vertex ${i / 10}: Color = (${vertexData_X[i + 6]}, ${
  //       vertexData_X[i + 7]
  //     }, ${vertexData_X[i + 8]}, ${vertexData_X[i + 9]})`
  //   );
  // }

  // 写入顶点缓冲区
  device.queue.writeBuffer(vertexBuffer_lineSegment, 0, vertexData_lineSegment);
  device.queue.writeBuffer(vertexBuffer_torus, 0, vertexData_torus);
  device.queue.writeBuffer(vertexBuffer_X, 0, vertexData_X);

  // 创建实例数据
  // prettier-ignore
  // const instanceTransforms = new Float32Array([
  //   ...createTranslationMatrix(1, 0, 0), // 右移1单位
  //   ...createTranslationMatrix(-1, 0, 0), // 左移1单位
  //   ...multiplyMatrices(createTranslationMatrix(1, 0, 0), createRotationMatrix(0, 0, Math.PI / 2)), // 上移1单位，绕Z轴旋转90°
  //   ...multiplyMatrices(createTranslationMatrix(-1, 0, 0), createRotationMatrix(0, 0, Math.PI / 2)), // 下移1单位，绕Z轴旋转-90°
  // ]);

  let instanceTransforms = [
    // ✅ 第一批变换（Cylinder）
    [
      ...createTranslationMatrix(1, 0, 0),
      ...createTranslationMatrix(-1, 0, 0),
      ...multiplyMatrices(createTranslationMatrix(1, 0, 0), createRotationMatrix(0, 0, Math.PI / 2)),
      ...multiplyMatrices(createTranslationMatrix(-1, 0, 0), createRotationMatrix(0, 0, Math.PI / 2)),
    ],
    // ✅ 第二批变换（Torus）
    [
      ...createTranslationMatrix(-2, 2, 0),
      ...createTranslationMatrix(0, 2, 0),
      ...createTranslationMatrix(2, 2, 0),
      ...createTranslationMatrix(-2, 0, 0),
      ...createTranslationMatrix(0, 0, 0),
      ...createTranslationMatrix(2, 0, 0),
      ...createTranslationMatrix(-2, -2, 0),
      ...createTranslationMatrix(0, -2, 0),
      ...createTranslationMatrix(2, -2, 0),
    ],
    // ✅ 第三批变换（X）
    [
      ...createTranslationMatrix(-2, 2, 0),
      ...createTranslationMatrix(0, 2, 0),
      ...createTranslationMatrix(2, 2, 0),
      ...createTranslationMatrix(-2, 0, 0),
      ...createTranslationMatrix(0, 0, 0),
      ...createTranslationMatrix(2, 0, 0),
      ...createTranslationMatrix(-2, -2, 0),
      ...createTranslationMatrix(0, -2, 0),
      ...createTranslationMatrix(2, -2, 0),
    ],
  ];

  let toggleState = false;

  const indexSets = [
    {
      Cylinder: [0, 1, 3], // Cylinder: 保留 0, 1, 3（去掉 2）
      Torus: [0, 2, 4, 6, 8], // Torus: 只保留索引 0, 2, 4, 6, 8
      X: [1, 3, 5, 7], // X: 只保留索引 1, 3, 5, 7
    },
    {
      Cylinder: [0, 1, 3], // Cylinder: 保留 0, 1, 3（去掉 2）
      Torus: [1, 3, 5, 7], // Torus: 只保留索引 1, 3, 5, 7
      X: [0, 2, 4, 6, 8], // X: 只保留索引 0, 2, 4, 6, 8
    },
  ];

  let hiddenIndices = {
    Torus: new Array(9).fill(false), // Torus 组（9 个实例）
    X: new Array(9).fill(false), // X 组（9 个实例）
  };

  const toggleInstances = (index) => {
    if (index >= 1 && index <= 9) {
      hiddenIndices.Torus[index - 1] = !hiddenIndices.Torus[index - 1]; // 切换状态
    } else if (index >= 10 && index <= 18) {
      hiddenIndices.X[index - 10] = !hiddenIndices.X[index - 10]; // 切换状态
    }

    console.log(`Toggled Index: ${index}`, hiddenIndices);
    console.log(`instanceTransforms:`, instanceTransforms);

    // **确保每次按 16 个 float 进行分割**
    const splitInstances = (instances, hiddenArray) => {
      return instances.reduce((acc, _, i) => {
        if (i % 16 === 0) {
          // 只处理 4x4 矩阵的起始索引
          const instanceIndex = i / 16; // 计算实例索引
          if (!hiddenArray[instanceIndex]) {
            // 仅保留未隐藏的实例
            acc.push(...instances.slice(i, i + 16));
          }
        }
        return acc;
      }, []);
    };

    // 过滤出可见的实例
    const filteredTransforms = [
      instanceTransforms[0], // Cylinder 始终不变
      splitInstances(instanceTransforms[1], hiddenIndices.Torus), // 按 16 float 过滤 Torus
      splitInstances(instanceTransforms[2], hiddenIndices.X) // 按 16 float 过滤 X
  ];

    console.log(`filteredTransforms:`, filteredTransforms);
    return filteredTransforms;
  };

  function updateInstanceBuffer(index) {
    const newInstanceTransforms = toggleInstances(index);
    console.log("newInstanceTransforms:", newInstanceTransforms);

    const flattenInstanceTransforms = new Float32Array(
      newInstanceTransforms.flat(Infinity)
    );

    device.queue.writeBuffer(instanceBuffer, 0, flattenInstanceTransforms);

    instanceCountCylinder = Math.floor(newInstanceTransforms[0].length / 16);
    instanceCountTorus = Math.floor(newInstanceTransforms[1].length / 16);
    instanceCountX = Math.floor(newInstanceTransforms[2].length / 16);

    console.log(
      `Updated Instance Count - Cylinder: ${instanceCountCylinder}, Torus: ${instanceCountTorus}, X: ${instanceCountX}`
    );

    render(); // 重新渲染
  }

  document.querySelectorAll(`[id^="toggle"]`).forEach((button) => {
    button.addEventListener(`click`, (event) => {
      const id = event.target.id;
      const index = parseInt(id.replace(`toggle`, ``), 10);
      console.log(`index:`, index);
      updateInstanceBuffer(index);
    });
  });

  // document.getElementById("toggle1").addEventListener("click", () => {
  //   // toggleInstances(); // 切换状态
  //   updateInstanceBuffer(); // 更新 WebGPU 实例
  // });

  // const instance2Transforms = new Float32Array([
  //   ...createTranslationMatrix(-2, 0, 0), // 左移1单位
  // ])

  // const instanceCount = instanceTransforms.length / 16;
  // 计算实例数量
  let instanceCountCylinder = instanceTransforms[0].length / 16;
  let instanceCountTorus = instanceTransforms[1].length / 16;
  let instanceCountX = instanceTransforms[2].length / 16;
  console.log(`instanceCountCylinder: ${instanceCountCylinder}`);
  console.log(`instanceCountTorus: ${instanceCountTorus}`);
  console.log(`instanceCountX: ${instanceCountX}`);

  const flattenInstanceTransforms = new Float32Array(
    instanceTransforms.flat(Infinity) // 展平二维数组为一维数组
  );
  console.log(
    `flattenInstanceTransforms.length:`,
    flattenInstanceTransforms.length
  );

  // 创建实例缓冲区
  const instanceBuffer = device.createBuffer({
    label: "Instance Transform Buffer",
    size: flattenInstanceTransforms.byteLength,
    // usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(instanceBuffer, 0, flattenInstanceTransforms);

  // 定义顶点缓冲区布局
  // const vertexBufferLayout = [
  //   {
  //     arrayStride: 36, // 9 * 4 = 36 bytes per vertex
  //     attributes: [
  //       { format: "float32x3", offset: 0, shaderLocation: 0 }, // 顶点坐标
  //       { format: "float32x3", offset: 12, shaderLocation: 1 }, // 法线
  //       { format: "float32x3", offset: 24, shaderLocation: 2 }, // 颜色
  //     ],
  //   },
  // ];
  const vertexBufferLayout = [
    {
      arrayStride: 40, // 10*4 = 40 bytes per vertex
      attributes: [
        { format: "float32x3", offset: 0, shaderLocation: 0 }, // 顶点坐标
        { format: "float32x3", offset: 12, shaderLocation: 1 }, // 法线
        { format: "float32x4", offset: 24, shaderLocation: 2 }, // 颜色（RGBA）
      ],
    },
  ];

  // 定义shader缓冲区
  const shaderModule = device.createShaderModule({
    label: "Example shader module",
    code: shaderCode,
  });

  // 定义深度缓冲区
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // 定义统一缓冲区<-参数
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

  // 绑定组布局<-统一缓冲区<-参数
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0, // **Uniform Buffer**
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "uniform",
        },
      },
    ],
  });

  const bindGroupLayoutInstance = device.createBindGroupLayout({
    entries: [
      {
        binding: 0, // **实例缓冲区**
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "read-only-storage",
        },
      },
    ],
  });

  // 绑定组<-组布局<-统一缓冲区<-参数
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0, // **Uniform Buffer**
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  const bindGroupInstance = device.createBindGroup({
    layout: bindGroupLayoutInstance,
    entries: [
      {
        binding: 0,
        resource: { buffer: instanceBuffer },
      },
    ],
  });

  // 定义管线布局<-组布局<-统一缓冲区<-参数
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout, bindGroupLayoutInstance], // Explicit binding of laybout
  });

  // 定义渲染管线<-管线布局<-组布局<-统一缓冲区<-参数
  const renderPipeline = device.createRenderPipeline({
    layout: pipelineLayout, // not "auto"
    vertex: {
      module: shaderModule,
      entryPoint: "vertexMain",
      // buffers: [
      //   {
      //     arrayStride: 36, // 9 * 4 = 36 bytes per vertex
      //     attributes: [
      //       { format: "float32x3", offset: 0, shaderLocation: 0 }, // (x, y, z)
      //       { format: "float32x3", offset: 12, shaderLocation: 1 }, // (nx, ny, nz)
      //       { format: "float32x3", offset: 24, shaderLocation: 2 }, // (r, g, b)
      //     ],
      //   },
      // ],
      buffers: vertexBufferLayout,
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragmentMain",
      targets: [
        {
          format: canvasFormat,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        },
      ],
    },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    },
  });

  // 渲染
  // prettier-ignore
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
          clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 0.0 },
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
    renderPass.setBindGroup(0, bindGroup); // **绑定 uniformBuffer**
    renderPass.setBindGroup(1, bindGroupInstance); // **绑定 instanceBuffer**

    // 渲染lineSegment
    renderPass.setVertexBuffer(0, vertexBuffer_lineSegment);
    // renderPass.setVertexBuffer(1, instanceBuffer); // **绑定 Instance Buffer**
    renderPass.draw(vertexData_lineSegment.length / 10, instanceCountCylinder, 0, 0); // **多实例渲染**

    // 渲染torus
    renderPass.setVertexBuffer(0, vertexBuffer_torus);
    renderPass.draw(vertexData_torus.length / 10, instanceCountTorus, 0, instanceCountCylinder);

    // 渲染X
    renderPass.setVertexBuffer(0, vertexBuffer_X);
    renderPass.draw(vertexData_X.length / 10, instanceCountX, 0, instanceCountCylinder + instanceCountTorus);

    // console.log(`vertexData_X.length / 10: ${vertexData_X.length / 10}`)

    renderPass.end();
    device.queue.submit([encoder.finish()]);
  };

  // 定义视角矩阵
  // const createViewMatrix = (eye, center, up) => {
  //   const f = normalize([
  //     center[0] - eye[0],
  //     center[1] - eye[1],
  //     center[2] - eye[2],
  //   ]);
  //   const s = normalize(cross(f, up));
  //   const u = cross(s, f);

  //   // prettier-ignore
  //   return [
  //     s[0], u[0], -f[0], 0,
  //     s[1], u[1], -f[1], 0,
  //     s[2], u[2], -f[2], 0,
  //     -dot(s, eye), -dot(u, eye), dot(f, eye), 1
  //   ]
  // };

  const createViewMatrix = (eye, center, up, rotationX = 0, rotationY = 0) => {
    // 计算前向量
    let forward = normalize([
      center[0] - eye[0],
      center[1] - eye[1],
      center[2] - eye[2],
    ]);
    let right = normalize(cross(forward, up));
    let newUp = cross(right, forward);

    // 旋转角度（绕 X 和 Y 轴）
    const cosX = Math.cos(rotationX),
      sinX = Math.sin(rotationX);
    const cosY = Math.cos(rotationY),
      sinY = Math.sin(rotationY);

    // **绕 X 轴旋转（上下旋转）**
    let rotatedForwardX = [
      forward[0],
      forward[1] * cosX - forward[2] * sinX,
      forward[1] * sinX + forward[2] * cosX,
    ];
    let rotatedUpX = [
      newUp[0],
      newUp[1] * cosX - newUp[2] * sinX,
      newUp[1] * sinX + newUp[2] * cosX,
    ];

    // **绕 Y 轴旋转（左右旋转）**
    let rotatedForward = [
      rotatedForwardX[0] * cosY - rotatedForwardX[2] * sinY,
      rotatedForwardX[1],
      rotatedForwardX[0] * sinY + rotatedForwardX[2] * cosY,
    ];
    let rotatedRight = [
      right[0] * cosY - right[2] * sinY,
      right[1],
      right[0] * sinY + right[2] * cosY,
    ];

    let rotatedUp = cross(rotatedRight, rotatedForward);

    // 计算新的 `viewMatrix`
    return [
      rotatedRight[0],
      rotatedUp[0],
      -rotatedForward[0],
      0,
      rotatedRight[1],
      rotatedUp[1],
      -rotatedForward[1],
      0,
      rotatedRight[2],
      rotatedUp[2],
      -rotatedForward[2],
      0,
      -dot(rotatedRight, eye),
      -dot(rotatedUp, eye),
      dot(rotatedForward, eye),
      1,
    ];
  };

  const eye = [0, 0, 8],
    center = [0, 0, 0],
    up = [0, 1, 0];

  const viewMatrix = createViewMatrix(eye, center, up);

  // 定义投影矩阵
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

  // 定义投影矩阵参数
  const fov = Math.PI / 4,
    aspect = canvas.width / canvas.height,
    near = 0.1,
    far = 10.0;

  const projectionMatrix = createProjectionMatrix(fov, aspect, near, far);

  let rotationX = 0.0;
  let rotationY = 0.0;
  let isDragging = false;
  let needRender = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // 更新参数
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
    const viewMatrix = createViewMatrix(eye, center, up, rotationX, rotationY);

    const uniformData = new Float32Array([
      ...projectionMatrix,
      ...viewMatrix,
      0,
      0,
      0,
      0,
    ]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  };

  // document.addEventListener("mousedown", (event) => {
  //   isDragging = true;
  //   lastMouseX = event.clientX;
  //   lastMouseY = event.clientY;
  // });

  // document.addEventListener("mouseup", () => {
  //   isDragging = false;
  //   needRender = false;
  // });

  // document.addEventListener("mousemove", (event) => {
  //   if (isDragging) {
  //     let deltaX = (event.clientX - lastMouseX) * 0.01; // 旋转比例
  //     let deltaY = (event.clientY - lastMouseY) * 0.01;

  //     rotationY += deltaX; // 左右旋转（绕 Y 轴）
  //     rotationX += deltaY; // 上下旋转（绕 X 轴）

  //     lastMouseX = event.clientX;
  //     lastMouseY = event.clientY;

  //     updateUniforms(); // 更新 GPU uniform
  //     needRender = true;
  //   }
  // });

  // 更新alpha
  const updateAlpha = () => {
    // let instanceTransforms = flattenInstanceTransforms.slice(); // 复制当前变换数据
    // // 修改 Alpha
    let newVertexData = new Float32Array(vertexData_X); // 复制原始数据

    for (let i = 0; i < newVertexData.length / 10; i++) {
      // 每 10 个 float 是一个顶点
      newVertexData[i * 10 + 9] = 0.0; // 第 10 个 float 是 Alpha 通道
    }
    device.queue.writeBuffer(vertexBuffer_X, 0, newVertexData);
  };

  const animationLoop = () => {
    updateUniforms();
    // updateAlpha();
    render();
    requestAnimationFrame(animationLoop);
  };
  // const animationLoop = () => {
  //   if (needRender) {
  //     render();
  //     needRender = false;
  //   }
  //   requestAnimationFrame(animationLoop);
  // };

  updateUniforms();

  // updateAlpha();

  render();

  animationLoop();
}
runExample();
