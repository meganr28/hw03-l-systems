import {vec3, mat4} from 'gl-matrix';
import LinkedList from './LinkedList';
import Turtle, { LeafInstance, TurtleInstance } from "./Turtle";

export class DrawingPostcondition {
  drawCmd: any;
	probability: number;

  constructor(cmd : any, prob : number) {
      this.drawCmd = cmd;
      this.probability = prob;
  }
};

export class DrawingRule {
	postconditions: Array<DrawingPostcondition> = [];

  constructor(pconds : DrawingPostcondition[]) {
    for (let i = 0; i < pconds.length; i++) {
      this.postconditions.push(pconds[i]);
    }
  }
};

export class DrawingRuleMap {
	drawingRules: Map<string, DrawingRule> = new Map();
};

class LsystemRenderer {
  symbolList: LinkedList;
  turtleStates: Array<Turtle>;
  drawMap: DrawingRuleMap;
  turt: Turtle; // current state of the turtle

  // Drawing attributes
  angle: number;
  length: number;
  depth: number;
  leafDensity: number;

  // Arrays for instanced rendering of branches and leaves
  positions: Array<vec3>;
  orientations: Array<vec3>;
  instances: Array<TurtleInstance>;
  leaves: Array<LeafInstance>;

  constructor(symbols: LinkedList, angle : number, length: number, leafDensity: number) {
    this.symbolList = symbols;
    this.turtleStates = new Array();
    this.drawMap = new DrawingRuleMap();
    this.turt = new Turtle(vec3.fromValues(5.0, 0.0, -200.0), vec3.fromValues(0.0, 1.0, 0.0), vec3.fromValues(0.0, 0.0, 0.0));
    this.angle = angle;
    this.length = length;
    this.depth = 0;
    this.leafDensity = leafDensity;

    this.positions = new Array();
    this.orientations = new Array();
    this.instances = new Array();
    this.leaves = new Array();

    // Initialize library of map symbols
    this.initializeMap();
  }

  setAngle(angle : number) {
    this.angle = angle;
  }

  setAxiom(axiom : LinkedList) {
    this.symbolList = axiom;
  }

  setLeafDensity(density: number) {
    this.leafDensity = density;
  }

  setStepSize(length : number) {
    this.length = length;
  }

  initializeMap() {
    let pcond1 = new DrawingPostcondition(this.moveForward.bind(this), 1.0);
    let pcond2 = new DrawingPostcondition(this.rotateRight.bind(this), 1.0);
    let pcond3 = new DrawingPostcondition(this.rotateLeft.bind(this), 1.0);
    let pcond4 = new DrawingPostcondition(this.pitchDown.bind(this), 1.0);
    let pcond5 = new DrawingPostcondition(this.pitchUp.bind(this), 1.0);
    let pcond6 = new DrawingPostcondition(this.rollClockwise.bind(this), 1.0);
    let pcond7 = new DrawingPostcondition(this.rollCounterClockwise.bind(this), 1.0); 
    let pcond8 = new DrawingPostcondition(this.pushState.bind(this), 1.0);
    let pcond9 = new DrawingPostcondition(this.popState.bind(this), 1.0);
    let pcond10 = new DrawingPostcondition(this.addLeaf.bind(this), 1.0);

    let rule1 = new DrawingRule([pcond1]);
    let rule2 = new DrawingRule([pcond2]);
    let rule3 = new DrawingRule([pcond3]);
    let rule4 = new DrawingRule([pcond4]);
    let rule5 = new DrawingRule([pcond5]);
    let rule6 = new DrawingRule([pcond6]);
    let rule7 = new DrawingRule([pcond7]);
    let rule8 = new DrawingRule([pcond8]);
    let rule9 = new DrawingRule([pcond9]);
    let rule10 = new DrawingRule([pcond10]);

    this.drawMap.drawingRules.set('F', rule1);     // move forward
    this.drawMap.drawingRules.set('+', rule2);     // rotate right
    this.drawMap.drawingRules.set('-', rule3);     // rotate left
    this.drawMap.drawingRules.set('&', rule4);     // pitch down
    this.drawMap.drawingRules.set('^', rule5);     // pitch up
    this.drawMap.drawingRules.set('\\\\', rule6);  // roll clockwise
    this.drawMap.drawingRules.set('/', rule7);     // roll counter-clockwise
    this.drawMap.drawingRules.set('[', rule8);     // push state
    this.drawMap.drawingRules.set(']', rule9);     // pop state
    this.drawMap.drawingRules.set('L', rule10);    // draw leaf
  }

  clearTurtleState() {
    this.turt.position = vec3.fromValues(5, 0, -200);     
    this.turt.direction = vec3.fromValues(0, 1, 0);   
    this.turt.orientation = vec3.fromValues(0, 0, 0); 
    this.turt.depth = 0;

    this.positions = [];
    this.orientations = [];
    this.instances = [];
    this.leaves = [];
  }

  render() {
    this.clearTurtleState();
    // Iterate through list of symbols 
    for (let i = 0; i < this.symbolList.nodes.length; i++) {
        let sym = this.symbolList.nodes[i].character;
        // Query drawing rules map for drawing command that corresponds with symbol
        // If a command exists, execute it
        let drawRule = this.drawMap.drawingRules.get(sym);
        let drawCmd = null;
        if (drawRule) {
          drawCmd = drawRule.postconditions[0].drawCmd;
        }
        if (drawCmd) { 
            let addOffset : number = drawCmd();
            if (addOffset) this.addTurtleInstance(this.depth);
        }
    }
  }

  addLeaf() {
    let rand : number = Math.random();
    // Find random angle
    let rand_angle : number = rand * 90.0;
    if (rand < this.leafDensity) {
      // Perturb leaf orientation
      let orient : vec3 = vec3.create();
      vec3.add(orient, this.turt.orientation, vec3.fromValues(rand_angle + 20, 0, rand_angle))
      let leafInstance : LeafInstance = new LeafInstance(this.turt.position, orient);
      this.leaves.push(leafInstance);
    }
  }

  addTurtleInstance(iter : number) {
    let turtleInstance : TurtleInstance = new TurtleInstance(this.turt.position, this.turt.orientation, iter);
    // Add current position and orientation to vectors for instanced rendering
    this.instances.push(turtleInstance);
  }

  moveForward() {
    this.turt.moveForward(this.length);
    return 1;
  }

  rotateLeft() {
    this.turt.rotateLeft(this.angle);
    return 0;
  }

  rotateRight() {
    this.turt.rotateRight(this.angle);
    return 0;
  }

  pitchDown() {
    this.turt.pitchDown(this.angle);
    return 0;
  }

  pitchUp() {
    this.turt.pitchUp(this.angle);
    return 0;
  }

  rollClockwise() {
    this.turt.rollClockwise(this.angle);
    return 0;
  }

  rollCounterClockwise() {
    this.turt.rollCounterClockwise(this.angle);
    return 0;
  }

  pushState() {
    let turtleState = new Turtle(this.turt.position, this.turt.direction, this.turt.orientation);
    this.turtleStates.push(this.turt);
    this.turt = turtleState;
    this.depth++;
    return 0;
  }

  popState() {
    this.turt = this.turtleStates.pop();
    this.depth--
    return 0;
  }
};

export default LsystemRenderer;