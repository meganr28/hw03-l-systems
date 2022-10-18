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
import { TurtleInstance } from './lsystem/Turtle';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Iterations: 8.0,
  Angle: 20.0,
  StepSize: 5.0,
  Axiom: "FFFAFF",
  Rule_1: "A=F[+FA][-FA]+F[-FA]+F",
  Probability_1: 0.6,
  Rule_2: "A=F[&FA][^FA]&F[^FA]",
  Probability_2: 0.4,
  'UpdateLsystem' : updateLsystem
};

let square: Square;
let screenQuad: ScreenQuad;
let cylinder: Mesh;
let cube: Cube; 
let time: number = 0.0;

let lsystemParser : LsystemParser;
let lsystemRenderer : LsystemRenderer;
let axiom : LinkedList;

// GUI parameters
let prevIterations: number = 8.0;
let prevAngle: number = 20.0;
let prevStepSize: number = 4.0;
let prevAxiom: string = "FFFAFF";
let prevRule1: string = "A=F[+FA][-FA]+F[-FA]";
let prevProbability1: number = 0.6;
let prevRule2: string = "A=F[&FA][^FA]";
let prevProbability2: number = 0.4;

// Color palette
let lightPurple = vec3.fromValues(0.91, 0.85, 1.0);
let darkPurple = vec3.fromValues(0.4, 0.3, 0.56);

// Lerp function
function mix(a : vec3, b : vec3, t : number) {
  let m1 = vec3.fromValues(1.0 - t, 1.0 - t, 1.0 - t);
  let m2 = vec3.fromValues(t, t, t);
  //console.log(m1, m2);
  let aCopy : vec3 = vec3.create();
  let bCopy : vec3 = vec3.create();
  let ret : vec3 = vec3.create();
  vec3.add(ret, vec3.multiply(aCopy, a, m1), vec3.multiply(bCopy, b, m2));
  return ret;
}

function updateBuffers() {
  let offsetsArray = [];
  let colorsArray = [];

  let n : number = lsystemRenderer.instances.length;
  for (let k = 0; k < n; k++) {
    let instance : TurtleInstance = lsystemRenderer.instances[k];
    let pos : vec3 = instance.position;
    //console.log("Position: ", pos);
    let rot : vec3 = instance.orientation;
    //console.log("Rotation: ", rot);
    //console.log("Iteration: ", instance.depth);
    let extraScale = 1.0;
    if (k < 5) extraScale *= 5.0;
    let scl : vec3 = vec3.fromValues(3.0 * Math.pow(0.75, instance.depth), controls.StepSize * Math.pow(1.0, instance.depth), 3.0 * Math.pow(0.75, instance.depth));
    //console.log(instance.depth);

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
    //console.log("Color: ", col);
    colorsArray.push(col[0]);
    colorsArray.push(col[1]);
    colorsArray.push(col[2]);
    colorsArray.push(1.0);

    // colorsArray.push((k / n) * pos[1] / 5000.0);
    // colorsArray.push((k / n) * pos[1] / 5000.0);
    // colorsArray.push(1.0);
    // colorsArray.push(1.0);

    //console.log("Color: ", (k / n) * pos[1] / 5000.0);
  }
  //console.log("Offsets array: ", offsetsArray);
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  cube.setInstanceVBOs(offsets, colors);
  cube.setNumInstances(n);
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

  if (controls.Rule_1 != prevRule1)
  {
    prevRule1 = controls.Rule_1;
    lsystemParser.setRules([controls.Rule_1, controls.Rule_2], [controls.Probability_1, controls.Probability_2]);
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
    lsystemParser.setRules([controls.Rule_1, controls.Rule_2], [controls.Probability_1, controls.Probability_2]);
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (controls.Probability_2 != prevProbability2)
  {
    prevProbability2 = controls.Probability_2;
    lsystemParser.grammar.updateRuleProbability(controls.Rule_2, controls.Probability_2, 1);
    lsystemParser.clearAxiom(controls.Axiom);
    axiom = lsystemParser.parse();
    paramsDirty = 1;
  }

  if (paramsDirty) {
    lsystemRenderer.setAxiom(axiom);
    //axiom.print();
    lsystemRenderer.render();
    updateBuffers();
  }
}

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  cylinder = new Mesh("./obj/cylinder.obj", vec3.fromValues(0, 0, 0));
  cylinder.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();

  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  //let offsetsArray = [];
  //let colorsArray = [];
  /*let n: number = 100.0;
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);

      colorsArray.push(i / n);
      colorsArray.push(j / n);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n); // grid of "particles"*/

  // Test out Lsystem
  lsystemParser = new LsystemParser(controls.Axiom, [controls.Rule_1, controls.Rule_2], [controls.Probability_1, controls.Probability_2], controls.Iterations);
  axiom = lsystemParser.parse();
  //axiom.print();

  //let symbolList = new LinkedList("F+F-F-F+F");
  lsystemRenderer = new LsystemRenderer(axiom, controls.Angle, controls.StepSize);
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
  gui.add(controls, 'Iterations', 0, 10).step(1).listen();
  gui.add(controls, 'Angle', 0, 90.0).step(1.0).listen();
  gui.add(controls, 'StepSize', 0, 10).step(1);
  gui.add(controls, 'Axiom');
  gui.add(controls, 'Rule_1');
  gui.add(controls, 'Probability_1', 0.0, 1.0).step(0.01);
  gui.add(controls, 'Rule_2');
  gui.add(controls, 'Probability_2', 0.0, 1.0).step(0.01);
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
    //updateLsystem();
    renderer.clear();
    //gl.disable(gl.DEPTH_TEST);
    renderer.render(camera, sdf, [screenQuad]);
    // gl.enable(gl.DEPTH_TEST);
    renderer.render(camera, instancedShader, [
      cube,
    ]);
    //renderer.render(camera, flat, [cube]);
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
