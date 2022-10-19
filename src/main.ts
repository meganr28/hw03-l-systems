import {vec3, mat4, quat} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Mesh from './geometry/Mesh';
import LinkedList from './lsystem/LinkedList';
import LsystemRenderer from './lsystem/LsystemRenderer';
import LsystemParser from './lsystem/LsystemParser';
import Cube from './geometry/Cube';
import { LeafInstance, TurtleInstance } from './lsystem/Turtle';
import Icosphere from './geometry/Icosphere';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Iterations: 8.0,
  Angle: 20.0,
  StepSize: 5.0,
  Axiom: "FFA",
  Rule_1: "A=F[+FA][-FA]+FF[-FA]L",
  Probability_1: 0.6,
  Rule_2: "A=F[&FA][^FA]&F[^FA]",
  Probability_2: 0.4,
  Rule_3: "X=F[+X][-X]BX",
  Probability_3: 1.0,
  Rule_4: "B=FFB",
  Probability_4: 1.0,
  CrystalDensity: 0.5,
  'UpdateLsystem' : updateLsystem
};

let square: Square;
let screenQuad: ScreenQuad;
let cylinder: Mesh;
let cube: Cube; 
let sphere: Icosphere;
let time: number = 0.0;

let lsystemParser : LsystemParser;
let lsystemRenderer : LsystemRenderer;
let axiom : LinkedList;

// GUI parameters
let prevIterations: number = 6.0;
let prevAngle: number = 20.0;
let prevStepSize: number = 5.0;
let prevAxiom: string = "FFA";
let prevRule1: string = "A=F[+FA][-FA]FF+F[-FA]X";
let prevProbability1: number = 1.0;
let prevRule2: string = "X=F[+X][-X]FX";
let prevProbability2: number = 1.0;
let prevRule3: string = "F=FF";
let prevProbability3: number = 1.0;
let prevRule4: string = "F=FF";
let prevProbability4: number = 1.0;
let prevLeafDensity: number = 0.5;

// Color palette
let lightPurple = vec3.fromValues(0.95, 0.85, 1.0);
let darkPurple = vec3.fromValues(0.3, 0.2, 0.6);

// Lerp function
function mix(a : vec3, b : vec3, t : number) {
  let m1 = vec3.fromValues(1.0 - t, 1.0 - t, 1.0 - t);
  let m2 = vec3.fromValues(t, t, t);
  let aCopy : vec3 = vec3.create();
  let bCopy : vec3 = vec3.create();
  let ret : vec3 = vec3.create();
  vec3.add(ret, vec3.multiply(aCopy, a, m1), vec3.multiply(bCopy, b, m2));
  return ret;
}

function updateBuffers() {
  let offsetsArray = [];
  let colorsArray = [];
  let leafOffsets = [];
  let leafColors = [];

  // Loop through branches
  let n : number = lsystemRenderer.instances.length;
  for (let k = 0; k < n; k++) {
    let instance : TurtleInstance = lsystemRenderer.instances[k];
    let pos : vec3 = instance.position;
    let rot : vec3 = instance.orientation;
    let scl : vec3 = vec3.fromValues(3.0 * Math.pow(0.65, instance.depth), controls.StepSize * Math.pow(1.0, instance.depth), 3.0 * Math.pow(0.75, instance.depth));

    // Transform rotation into quaternion
    let quat_rot : quat = quat.create();
    quat.fromEuler(quat_rot, rot[0], rot[1], rot[2]);
    let transform = mat4.create();
    mat4.fromRotationTranslationScale(transform, quat_rot, pos, scl);

    // Copy over matrix into offsets array one column at a time
    for (let m = 0; m < 16; m += 4) {
      offsetsArray.push(transform[m]);
      offsetsArray.push(transform[m + 1]);
      offsetsArray.push(transform[m + 2]);
      offsetsArray.push(transform[m + 3]);
    }

    let col : vec3 = mix(darkPurple, lightPurple, (instance.depth / controls.Iterations));
    colorsArray.push(col[0]);
    colorsArray.push(col[1]);
    colorsArray.push(col[2]);
    colorsArray.push(1.0);
  }

  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  cube.setInstanceVBOs(offsets, colors);
  cube.setNumInstances(n);

  // Loop through leaves
  let w : number = lsystemRenderer.leaves.length;
  for (let k = 0; k < w; k++) {
    let instance : LeafInstance = lsystemRenderer.leaves[k];
    let pos : vec3 = instance.position;
    let rot : vec3 = instance.orientation;
    let scl : vec3 = vec3.fromValues(1.0, 2.0, 1.0);

    // Transform rotation into quaternion
    let quat_rot : quat = quat.create();
    quat.fromEuler(quat_rot, rot[0], rot[1], rot[2]);
    let transform = mat4.create();
    mat4.fromRotationTranslationScale(transform, quat_rot, pos, scl);

    // Copy over matrix into offsets array one column at a time
    for (let m = 0; m < 16; m += 4) {
      leafOffsets.push(transform[m]);
      leafOffsets.push(transform[m + 1]);
      leafOffsets.push(transform[m + 2]);
      leafOffsets.push(transform[m + 3]);
    }

    let col : vec3 = darkPurple;
    col = vec3.fromValues(1.0, 1.0, 1.0);
    leafColors.push(col[0]);
    leafColors.push(col[1]);
    leafColors.push(col[2]);
    leafColors.push(1.0);
  }

  let l_offsets: Float32Array = new Float32Array(leafOffsets);
  let l_colors: Float32Array = new Float32Array(leafColors);
  sphere.setInstanceVBOs(l_offsets, l_colors);
  sphere.setNumInstances(w);
}

function updateLsystem() {
  let paramsDirty : number = 0;

  if (controls.Iterations != prevIterations)
  {
    prevIterations = controls.Iterations;
    lsystemParser.clearAxiom(controls.Axiom);
    lsystemParser.setIterations(controls.Iterations);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Angle != prevAngle)
  {
    prevAngle = controls.Angle;
    lsystemRenderer.setAngle(controls.Angle);
    paramsDirty = 1;
  }

  if (controls.StepSize != prevStepSize)
  {
    prevStepSize = controls.StepSize;
    lsystemRenderer.setStepSize(controls.StepSize);
    paramsDirty = 1;
  }

  if (controls.Axiom != prevAxiom)
  {
    prevAxiom = controls.Axiom;
    lsystemParser.setAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.CrystalDensity != prevLeafDensity)
  {
    prevLeafDensity = controls.CrystalDensity;
    lsystemRenderer.setLeafDensity(controls.CrystalDensity);
    paramsDirty = 1;
  }

  if (controls.Rule_1 != prevRule1)
  {
    prevRule1 = controls.Rule_1;
    lsystemParser.setRules([controls.Rule_1, controls.Rule_2, controls.Rule_3, controls.Rule_4], [controls.Probability_1, controls.Probability_2, controls.Probability_3, controls.Probability_4]);
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Probability_1 != prevProbability1)
  {
    prevProbability1 = controls.Probability_1;
    lsystemParser.grammar.updateRuleProbability(controls.Rule_1, controls.Probability_1, 0);
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Rule_2 != prevRule2)
  {
    prevRule2 = controls.Rule_2;
    lsystemParser.setRules([controls.Rule_1, controls.Rule_2, controls.Rule_3, controls.Rule_4], [controls.Probability_1, controls.Probability_2, controls.Probability_3, controls.Probability_4]);
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Probability_2 != prevProbability2)
  {
    prevProbability2 = controls.Probability_2;
    lsystemParser.grammar.updateRuleProbability(controls.Rule_2, controls.Probability_2, 0); 
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Rule_3 != prevRule3)
  {
    prevRule3 = controls.Rule_3;
    lsystemParser.setRules([controls.Rule_1, controls.Rule_2, controls.Rule_3, controls.Rule_4], [controls.Probability_1, controls.Probability_2, controls.Probability_3, controls.Probability_4]);
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Probability_3 != prevProbability3)
  {
    prevProbability3 = controls.Probability_3;
    lsystemParser.grammar.updateRuleProbability(controls.Rule_3, controls.Probability_3, 0); 
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Rule_4 != prevRule4)
  {
    prevRule3 = controls.Rule_4;
    lsystemParser.setRules([controls.Rule_1, controls.Rule_2, controls.Rule_3, controls.Rule_4], [controls.Probability_1, controls.Probability_2, controls.Probability_3, controls.Probability_4]);
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Probability_4 != prevProbability4)
  {
    prevProbability3 = controls.Probability_4;
    lsystemParser.grammar.updateRuleProbability(controls.Rule_4, controls.Probability_4, 0); 
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (paramsDirty) {
    lsystemRenderer.setAxiom(axiom);
    lsystemRenderer.render();
    updateBuffers();
  }
}

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  sphere = new Icosphere(vec3.fromValues(0, 0, 0), 1.0, 3);
  sphere.create();

  // Initialize Lsystem
  lsystemParser = new LsystemParser(controls.Axiom, [controls.Rule_1, controls.Rule_2, controls.Rule_3, controls.Rule_4], [controls.Probability_1, controls.Probability_2, controls.Probability_3, controls.Probability_4], controls.Iterations);
  axiom = lsystemParser.parse();

  lsystemRenderer = new LsystemRenderer(axiom, controls.Angle, controls.StepSize, controls.CrystalDensity);
  lsystemRenderer.render();
  updateBuffers();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Iterations', 0, 8).step(1).listen();
  gui.add(controls, 'Angle', 0, 30.0).step(1.0).listen();
  gui.add(controls, 'StepSize', 0, 10).step(1);
  gui.add(controls, 'Axiom');
  gui.add(controls, 'Rule_1');
  gui.add(controls, 'Probability_1', 0.0, 1.0).step(0.01);
  gui.add(controls, 'Rule_2');
  gui.add(controls, 'Probability_2', 0.0, 1.0).step(0.01);
  gui.add(controls, 'Rule_3');
  gui.add(controls, 'Probability_3', 0.0, 1.0).step(0.01);
  gui.add(controls, 'Rule_4');
  gui.add(controls, 'Probability_4', 0.0, 1.0).step(0.01);
  gui.add(controls, 'CrystalDensity', 0.0, 1.0).step(0.01);
  gui.add(controls, 'UpdateLsystem').listen();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  //gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const sdf = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/sdf-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/sdf-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    sdf.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    
    // Dynamically update the tree when iterations, angle, and step size are changed
    if (controls.Iterations != prevIterations)
    {
      updateLsystem();
    }

    if (controls.Angle != prevAngle)
    {
      updateLsystem();
    }

    if (controls.StepSize != prevStepSize)
    {
      updateLsystem();
    }

    renderer.clear();
    gl.enable(gl.DEPTH_TEST);
    // Background
    renderer.render(camera, sdf, [screenQuad], 0);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    // Branches
    renderer.render(camera, instancedShader, [
      cube,
    ], 0);
    // Crystals
    renderer.render(camera, instancedShader, [
      sphere,
    ], 1);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
    sdf.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);
  sdf.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
