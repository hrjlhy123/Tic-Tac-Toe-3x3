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

const mat3Multiply = (mat, vec) => {
  return [
    mat[0] * vec[0] + mat[1] * vec[1] + mat[2] * vec[2],
    mat[3] * vec[0] + mat[4] * vec[1] + mat[5] * vec[2],
    mat[6] * vec[0] + mat[7] * vec[1] + mat[8] * vec[2],
  ];
};

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
    let vNew = mat3Multiply(rotationMatrix, v);

    let n = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
    let nNew = mat3Multiply(rotationMatrix, n);

    rotated.push(
      vNew[0],
      vNew[1],
      vNew[2], // 旋转后的顶点坐标
      nNew[0],
      nNew[1],
      nNew[2], // 旋转后的法线
      ...vertices.slice(i + 6, i + 10)
    ); // 复制颜色等信息
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
  const angleStep2 = (Math.PI / 2) / (segment / 2);

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

      let n1 = normalize([x1, y1 + height / 2, z1]),
          n2 = normalize([x2, y2 + height / 2, z2]),
          n3 = normalize([r1 * Math.cos(theta + angleStep), y1 + height / 2, r1 * Math.sin(theta + angleStep)]),
          n4 = normalize([r2 * Math.cos(theta + angleStep), y2 + height / 2, r2 * Math.sin(theta + angleStep)]);
    

      // vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 0.0, 1.0);
      // vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0, 1.0);
      // vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n1[0], n1[1], n1[2], 1.0, 1.0, 0.0, 1.0);
      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n3[0], n3[1], n3[2], 1.0, 1.0, 1.0, 1.0);

      // vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0, 1.0);
      // vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n1[0], n1[1], n1[2], 1.0, 1.0, 0.0, 1.0);
      // vertices.push(r2 * Math.cos(theta + angleStep), y2, r2 * Math.sin(theta + angleStep), n2[0], n2[1], n2[2], 0.0, 1.0, 1.0, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n3[0], n3[1], n3[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(r2 * Math.cos(theta + angleStep), y2, r2 * Math.sin(theta + angleStep), n4[0], n4[1], n4[2], 1.0, 1.0, 1.0, 1.0);
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

      let n1 = normalize([x1, y1 - height / 2, z1]),
          n2 = normalize([x2, y2 - height / 2, z2]),
          n3 = normalize([r1 * Math.cos(theta + angleStep), y1 - height / 2, r1 * Math.sin(theta + angleStep)]),
          n4 = normalize([r2 * Math.cos(theta + angleStep), y2 - height / 2, r2 * Math.sin(theta + angleStep)]);
    

      // vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.5, 0.5, 1.0);
      // vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.5, 0.5, 1.0, 1.0);
      // vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n1[0], n1[1], n1[2], 1.0, 0.5, 0.5, 1.0);
      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n3[0], n3[1], n3[2], 1.0, 1.0, 1.0, 1.0);

      // vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.5, 0.5, 1.0, 1.0);
      // vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n1[0], n1[1], n1[2], 1.0, 0.5, 0.5, 1.0);
      // vertices.push(r2 * Math.cos(theta + angleStep), y2, r2 * Math.sin(theta + angleStep), n2[0], n2[1], n2[2], 0.5, 0.5, 1.0, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(r1 * Math.cos(theta + angleStep), y1, r1 * Math.sin(theta + angleStep), n3[0], n3[1], n3[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(r2 * Math.cos(theta + angleStep), y2, r2 * Math.sin(theta + angleStep), n4[0], n4[1], n4[2], 1.0, 1.0, 1.0, 1.0);
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
    // let nx1 = x1,
    //     nz1 = z1,
    //     nx2 = x2,
    //     nz2 = z2;

    let n1 = normalize([x1, 0, z1]), // 底部左侧
        n2 = normalize([x1, 0, z1]), // 顶部左侧
        n3 = normalize([x2, 0, z2]), // 顶部右侧
        n4 = normalize([x2, 0, z2]); // 底部右侧

    // Logic-3-1: Triangle1 (A, B, C)
    // vertices.push(x1, -height / 2, z1, nx1, 0, nz1, 1.0, 0.0, 1.0, 1.0);
    // vertices.push(x1, height / 2, z1, nx1, 0, nz1, 0.0, 0.0, 1.0, 1.0);
    // vertices.push(x2, height / 2, z2, nx2, 0, nz2, 1.0, 1.0, 0.0, 1.0);
    // vertices.push(x1, -height / 2, z1, n1[0], n1[1], n1[2], 1.0, 0.0, 1.0, 1.0);
    // vertices.push(x1, height / 2, z1, n1[0], n1[1], n1[2], 0.0, 0.0, 1.0, 1.0);
    // vertices.push(x2, height / 2, z2, n2[0], n2[1], n2[2], 1.0, 1.0, 0.0, 1.0);
    vertices.push(x1, -height / 2, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 1.0, 1.0);
    vertices.push(x1, height / 2, z1, n2[0], n2[1], n2[2], 1.0, 1.0, 1.0, 1.0);
    vertices.push(x2, height / 2, z2, n3[0], n3[1], n3[2], 1.0, 1.0, 1.0, 1.0);

    // Logic-3-2: Triangle2 (A, C, D)
    // vertices.push(x1, -height / 2, z1, nx1, 0, nz1, 1.0, 0.0, 1.0, 1.0);
    // vertices.push(x2, height / 2, z2, nx2, 0, nz2, 1.0, 1.0, 0.0, 1.0);
    // vertices.push(x2, -height / 2, z2, nx2, 0, nz2, 0.0, 1.0, 0.0, 1.0);
    // vertices.push(x1, -height / 2, z1, n1[0], n1[1], n1[2], 1.0, 0.0, 1.0, 1.0);
    // vertices.push(x2, height / 2, z2, n2[0], n2[1], n2[2], 1.0, 1.0, 0.0, 1.0);
    // vertices.push(x2, -height / 2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 0.0, 1.0);
    vertices.push(x1, -height / 2, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 1.0, 1.0);
    vertices.push(x2, height / 2, z2, n3[0], n3[1], n3[2], 1.0, 1.0, 1.0, 1.0);
    vertices.push(x2, -height / 2, z2, n4[0], n4[1], n4[2], 1.0, 1.0, 1.0, 1.0);
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
      // vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.0, 1.0, 1.0);
      // vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 0.0, 1.0, 1.0, 1.0);
      // vertices.push(x3, y3, z3, n3[0], n3[1], n3[2], 1.0, 1.0, 0.0, 1.0);
      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(x2, y2, z2, n2[0], n2[1], n2[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(x3, y3, z3, n3[0], n3[1], n3[2], 1.0, 1.0, 1.0, 1.0);

      // vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 0.0, 1.0, 1.0);
      // vertices.push(x3, y3, z3, n3[0], n3[1], n3[2], 1.0, 1.0, 0.0, 1.0);
      // vertices.push(x4, y4, z4, n4[0], n4[1], n4[2], 0.0, 1.0, 0.0, 1.0);
      vertices.push(x1, y1, z1, n1[0], n1[1], n1[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(x3, y3, z3, n3[0], n3[1], n3[2], 1.0, 1.0, 1.0, 1.0);
      vertices.push(x4, y4, z4, n4[0], n4[1], n4[2], 1.0, 1.0, 1.0, 1.0);
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
    modelMatrix: mat4x4<f32>,
    // normalMatrix: mat4x4<f32>
}

struct Uniforms {
    projectionMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>, // View matrix (camera position)
    rotationX: f32,
    rotationY: f32,
    position_mouse: vec2<f32>
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
    // let normalMatrix = instances[instanceIndex].normalMatrix;

    let worldPosition = modelMatrix * vec4f(coords, 1.0);
    let worldNormal = normalize((modelMatrix * vec4f(normal, 0.0)).xyz);

    outData.pos = uniforms.projectionMatrix * uniforms.viewMatrix * worldPosition; // 4D
    // outData.normal = normal; //  transmission normal
    outData.normal = worldNormal;
    outData.colors = colors;
    return outData;
}

@fragment
fn fragmentMain(fragData: DataStruct) -> @location(0) vec4f {
    // let lightDirection = normalize(vec3f(1.0, 1.0, 1.0)); // oblique overhead light source
    let lightDirection = normalize(vec3f(uniforms.position_mouse.x, uniforms.position_mouse.y, 5.0));
    
    // let smoothNormal = normalize(fragData.normal); // 归一化确保平滑
    
    let diffuse = max(dot(fragData.normal, lightDirection), 0.0);

    // let diffuse = max(dot(smoothNormal, lightDirection), 0.0);
    return vec4f(fragData.colors.rgb * diffuse * 1.0, fragData.colors.a);
    // return fragData.colors;
}
`;

// 定义图形计算
const canvas = document.getElementById("canvas_example");
const run = async () => {
  let normalizedX = 1.0,
    normalizedY = 1.0;

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
  // const canvas = document.getElementById("canvas_example");
  if (!canvas) {
    throw new Error("Could not access canvas in page");
  }
  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("Could not obtain WebGPU context for canvas");
  }

  // const limits = device.limits;
  // console.log("最大样本数（MSAA sample count）:", limits.maxSampledTexturesPerShaderStage);
  // console.log("最大纹理维度:", limits.maxTextureDimension2D);

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

  let hiddenIndices = {
    Torus: new Array(9).fill(false), // Torus 组（9 个实例）
    X: new Array(9).fill(false), // X 组（9 个实例）
  };

  const toggleInstances = (index) => {
    if (index >= 1 && index <= 9) {
      // 三种状态: O/X/隐藏
      if (hiddenIndices.Torus[index - 1] && hiddenIndices.X[index - 1]) {
        hiddenIndices.Torus[index - 1] = !hiddenIndices.Torus[index - 1];
      } else if (!hiddenIndices.X[index - 1]) {
        hiddenIndices.X[index - 1] = !hiddenIndices.X[index - 1];
      } else {
        hiddenIndices.Torus[index - 1] = !hiddenIndices.Torus[index - 1];
        hiddenIndices.X[index - 1] = !hiddenIndices.X[index - 1];
      }
    } else {
      hiddenIndices = {
        Torus: new Array(9).fill(true), // Torus 组（9 个实例）
        X: new Array(9).fill(true), // X 组（9 个实例）
      };
    }

    // console.log(`Toggled Index: ${index}`, hiddenIndices);
    // console.log(`instanceTransforms:`, instanceTransforms);

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
      splitInstances(instanceTransforms[2], hiddenIndices.X), // 按 16 float 过滤 X
    ];

    // console.log(`filteredTransforms:`, filteredTransforms);
    return filteredTransforms;
  };

  function updateInstanceBuffer(index) {
    const instanceTransforms_selected = toggleInstances(index);
    // console.log("newInstanceTransforms:", instanceTransforms_selected);

    const flattenInstanceTransforms = new Float32Array(
      instanceTransforms_selected.flat(Infinity)
    );

    device.queue.writeBuffer(instanceBuffer, 0, flattenInstanceTransforms);

    instanceCountCylinder = instanceTransforms_selected[0].length / 16;
    instanceCountTorus = instanceTransforms_selected[1].length / 16;
    instanceCountX = instanceTransforms_selected[2].length / 16;

    // console.log(`Updated Instance Count - Cylinder: ${instanceCountCylinder}, Torus: ${instanceCountTorus}, X: ${instanceCountX}`);

    render(); // 重新渲染
  }

  document.querySelectorAll(`[id^="toggle"]`).forEach((button) => {
    button.addEventListener(`click`, (event) => {
      const id = event.target.id;
      const index = parseInt(id.replace(`toggle`, ``), 10);
      // console.log(`index:`, index);
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
  // console.log(`flattenInstanceTransforms.length:`,flattenInstanceTransforms.length);

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

  const sampleCount = 4; // 设置 MSAA 级别（通常为 4）

  // 添加MSAA纹理
  const msaaTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: canvasFormat,
    sampleCount: sampleCount, // 关键：启用多重采样
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // 定义深度缓冲区
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    sampleCount: sampleCount,
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
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
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
    multisample: {
      count: 4
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
          // view: context.getCurrentTexture().createView(),
          view: msaaTexture.createView(), // ✅ 改为 MSAA 纹理
          resolveTarget: context.getCurrentTexture().createView(), // ✅ 解析到最终屏幕
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
  const updateUniforms = (x = 1.0, y = 1.0) => {
    const viewMatrix = createViewMatrix(eye, center, up, rotationX, rotationY);

    const uniformData = new Float32Array([
      ...projectionMatrix,
      ...viewMatrix,
      0,
      0, // rotationX, rotationY (8 bytes)
      x,
      y, // position_mouse (8 bytes)
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
    updateUniforms(normalizedX, normalizedY);
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

  updateUniforms(normalizedX, normalizedY);

  // updateAlpha();

  render();

  // 🚀 **在下一帧隐藏 Torus 和 X**
  requestAnimationFrame(() => {
    console.log("🔄 Hiding Torus and X...");

    // 初始化 hiddenIndices
    hiddenIndices.Torus = new Array(instanceCountTorus).fill(true);
    hiddenIndices.X = new Array(instanceCountX).fill(true);

    updateInstanceBuffer(null); // 立即隐藏并更新 GPU
  });

  animationLoop();

  // const checkTrigger = async () => {
  //   while (true) {
  //     try {
  //       const response = await fetch(
  //         "http://localhost:5000/trigger?" + Math.random()
  //       );
  //       // const text = await response.text();
  //       const data = await response.json();
  //       console.log("🎯 服务器返回:", data);
  //       // if (text === "toggle3") {
  //       //   document.getElementById("toggle3").click();
  //       // }

  //       if (data.number) {
  //         const button = document.getElementById(data.number);
  //         if (button) {
  //           if (data.parity == 1) {
  //             console.log("O");
  //             button.click();
  //           } else {
  //             console.log("X");
  //             button.click();
  //             button.click();
  //           }

  //           console.log(`✅ 触发按钮: ${data.number}`);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("❌ 获取 trigger 失败", error);
  //     }
  //     await new Promise((resolve) => setTimeout(resolve, 100)); // 每 2 秒检查一次
  //   }
  // };
  // checkTrigger();

  // const socket = new WebSocket("ws://localhost:5000");
  const socket = io("ws://localhost:5000");

  // 监听连接
  socket.on("connect", () => {
    console.log("✅ 连接 WebSocket 成功！");
  });

  // 监听消息
  socket.on("update", (data) => {
    // const data = JSON.parse(event.data);
    console.log("🎯 服务器响应:", data);
    if (data.number != 0) {
      const button = document.getElementById("toggle" + data.number);
      if (button) {
        let piece = "";
        if (data.parity == 1) {
          piece = "O";
          button.click();
          console.log(piece);
        } else if (data.parity == 0) {
          piece = "X";
          button.click();
          button.click();
          console.log(piece);
        }
        if ("win" in data) {
          if (data.win == true) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                alert(piece + " win!");
                socket.emit("info", { number: 0 });
                updateInstanceBuffer(null);
              });
            });
          } else if (data.win == false) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                alert("Tie!");
                socket.emit("info", { number: 0 });
                updateInstanceBuffer(null);
              });
            });
          }
        }
        console.log(`✅ 触发按钮: ${data.number}`);
      }
    } else if (data.number == 0) {
      console.log(`重置游戏`);
      updateInstanceBuffer(null);
    }
  });

  // 监听模式切换
  let gameMode = 1;
  document.querySelectorAll("input[name='gameMode']").forEach((input) => {
    input.addEventListener("change", (event) => {
      gameMode = event.target.value; // 更新模式
      console.log("gameMode:", gameMode + "P");
      // console.log("模式切换为:", gameMode == 1 ? "单人模式" : "双人模式");
      socket.emit("info", { number: 0, gameMode: gameMode });
    });
  });

  canvas.addEventListener("click", async (event) => {
    // 获取鼠标点击的屏幕坐标 (像素)
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left; // 归一化到 canvas 内部
    const y = event.clientY - rect.top;

    // **定义格子大小**
    const gridSize = 400; // 画布大小
    const offset = 15; // **边缘留白**
    const gap = 10; // **每个格子之间的间距**
    const cellSize = (gridSize - 2 * offset - gap * 2) / 3; // 计算单个格子的大小

    // **计算点击的行列索引**
    const col = Math.floor((x - offset) / (cellSize + gap));
    const row = Math.floor((y - offset) / (cellSize + gap));

    // **检查是否点击在有效区域内**
    if (
      x < offset ||
      x > gridSize - offset ||
      y < offset ||
      y > gridSize - offset
    ) {
      console.log("❌ 点击在边缘之外");
      return;
    }

    // **检查是否点击在间距区域**
    if (
      (x - offset) % (cellSize + gap) > cellSize ||
      (y - offset) % (cellSize + gap) > cellSize
    ) {
      console.log("❌ 点击在间距上");
      return;
    }

    if (row >= 0 && row < 3 && col >= 0 && col < 3) {
      const index = row * 3 + col + 1; // 计算格子编号
      console.log(`✅ 点击格子编号: ${index}`);

      // socket.send(JSON.stringify({ number: index }));
      socket.emit("info", { number: index });
      // // **🚀 发送编号到 Python**
      // try {
      //   const response = await fetch("http://localhost:5000/info", {
      //     method: "POST",
      //     mode: "cors", // 允许跨域请求
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ number: index }),
      //   });

      //   const data = await response.json();
      //   console.log("🎯 服务器响应:", data);
      //   if (data.number != 0) {
      //     const button = document.getElementById("toggle" + data.number);
      //     if (button) {
      //       let piece = "";
      //       if (data.parity == 1) {
      //         piece = "O";
      //         button.click();
      //         console.log(piece);
      //       } else if (data.parity == 0) {
      //         piece = "X";
      //         button.click();
      //         button.click();
      //         console.log(piece);
      //       }
      //       if ("win" in data) {
      //         if (data.win == true) {
      //           requestAnimationFrame(() => {
      //             requestAnimationFrame(() => {
      //               alert(piece + " win!");
      //             });
      //           });
      //         } else if (data.win == false) {
      //           requestAnimationFrame(() => {
      //             requestAnimationFrame(() => {
      //               alert("Tie!");
      //             });
      //           });
      //         }
      //       }
      //       console.log(`✅ 触发按钮: ${data.number}`);
      //     }
      //   } else if (data.number == 0) {
      //     console.log(`重置游戏`);
      //     updateInstanceBuffer(null);
      //   }
      // } catch (error) {
      //   console.error("❌ 发送编号失败:", error);
      // }
    }
    console.log(`🖱️ 点击屏幕坐标: (${x}, ${y})`);
  });

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    normalizedX = (2 * x) / rect.width - 1;
    normalizedY = 1 - (2 * y) / rect.height;

    requestAnimationFrame(() => {
      updateUniforms(normalizedX, normalizedY);
      render();
    });

    // console.log(`鼠标坐标：（${x}, ${y}）`);
    // console.log(`鼠标在 Canvas 内的归一化坐标: (${normalizedX.toFixed(2)}, ${normalizedY.toFixed(2)})`);
  });

  // 刷新重置游戏
  // window.addEventListener("beforeunload", async () => {
  //   // await fetch("http://localhost:5000/info", {
  //   //   method: "POST",
  //   //   mode: "cors",
  //   //   headers: { "Content-Type": "application/json" },
  //   //   body: JSON.stringify({ number: 0 }),
  //   //   keepalive: true, // **确保请求在页面关闭时仍然被发送**
  //   // });
  //   // socket.send(JSON.stringify({ number: 0 }));
  //   socket.emit("info", { number: 0 })
  // });
};
run();
