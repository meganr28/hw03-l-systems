import {vec3} from 'gl-matrix';
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

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Iterations: 1,
  Angle: 45.0,
  StepSize: 1.0,
  Axiom: "F",
  Rule_1: "F=F[+F][-F]",
  Probability_1: 1.0
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
let prevIterations: number = 1.0;
let prevAngle: number = 45.0;
let prevStepSize: number = 1.0;
let prevAxiom: string = "F";
let prevRule1: string = "F=F[+F][-F]";
let prevProbability1: number = 1.0;

function updateBuffers() {
  let offsetsArray = [];
  let colorsArray = [];

  let n : number = lsystemRenderer.positions.length;
  for (let k = 0; k < n; k++) {
    offsetsArray.push(lsystemRenderer.positions[k][0]);
    offsetsArray.push(lsystemRenderer.positions[k][1]);
    offsetsArray.push(lsystemRenderer.positions[k][2]);

    colorsArray.push(1.0);
    colorsArray.push(1.0);
    colorsArray.push(1.0);
    colorsArray.push(1.0);
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n);
}

function updateLsystem() {
  let paramsDirty : number = 0;

  if (controls.Iterations != prevIterations)
  {
    prevIterations = controls.Iterations;
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
    lsystemParser.setRules([controls.Rule_1], [controls.Probability_1]);
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

  if (paramsDirty) {
    lsystemRenderer.setAxiom(axiom);
    lsystemRenderer.render();
    updateBuffers();
  }
  // Update attributes
  // lsystemParser.setIterations(controls.Iterations);
  // lsystemParser.setAxiom(controls.Axiom);
  // lsystemParser.grammar.addRules([controls.Rule_1], [controls.Probability_1]);
  // let axiom : LinkedList = lsystemParser.parse();
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

  // Test out Lsystem class 
  lsystemParser = new LsystemParser(controls.Axiom, [controls.Rule_1], [controls.Probability_1], controls.Iterations);
  axiom = lsystemParser.parse();
  axiom.print();

  //let symbolList = new LinkedList("F+F-F-F+F");
  lsystemRenderer = new LsystemRenderer(axiom, controls.Angle, controls.StepSize);
  lsystemRenderer.render();
  updateBuffers();
  //console.log("Turtle initial positions: ", lsystemRenderer.turt.positions.length);
  //console.log("Turtle initial orientations: ", lsystemRenderer.turt.orientations.length);
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
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    updateLsystem();
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      square,
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
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
