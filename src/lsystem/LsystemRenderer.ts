import {vec3, mat4} from 'gl-matrix';
import LinkedList from './LinkedList';
import Turtle, { TurtleInstance } from "./Turtle";

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
  angle: number;
  length: number;
  depth: number;

  positions: Array<vec3>;
  orientations: Array<vec3>;
  instances: Array<TurtleInstance>;

  constructor(symbols: LinkedList, angle : number, length: number) {
    this.symbolList = symbols;
    this.turtleStates = new Array();
    this.drawMap = new DrawingRuleMap();
    this.turt = new Turtle(vec3.fromValues(5.0, 0.0, -100.0), vec3.fromValues(0.0, 1.0, 0.0), vec3.fromValues(0.0, 0.0, 0.0));
    this.angle = angle;
    this.length = length;
    this.depth = 0;

    this.positions = new Array();
    this.orientations = new Array();
    this.instances = new Array();

    // Initialize library of map symbols
    this.initializeMap();
  }

  setAngle(angle : number) {
    this.angle = angle;
  }

  setAxiom(axiom : LinkedList) {
    this.symbolList = axiom;
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

    let rule1 = new DrawingRule([pcond1]);
    let rule2 = new DrawingRule([pcond2]);
    let rule3 = new DrawingRule([pcond3]);
    let rule4 = new DrawingRule([pcond4]);
    let rule5 = new DrawingRule([pcond5]);
    let rule6 = new DrawingRule([pcond6]);
    let rule7 = new DrawingRule([pcond7]);
    let rule8 = new DrawingRule([pcond8]);
    let rule9 = new DrawingRule([pcond9]);

    this.drawMap.drawingRules.set('F', rule1);
    this.drawMap.drawingRules.set('+', rule2);
    this.drawMap.drawingRules.set('-', rule3);
    this.drawMap.drawingRules.set('&', rule4);
    this.drawMap.drawingRules.set('^', rule5);
    this.drawMap.drawingRules.set('\\\\', rule6);
    this.drawMap.drawingRules.set('/', rule7);
    this.drawMap.drawingRules.set('[', rule8);
    this.drawMap.drawingRules.set(']', rule9);

    // this.drawMap.drawingRules.forEach((value: DrawingRule, key: string) => {
    //     console.log(key, value.postconditions[0]);
    // });
  }

  clearTurtleState() {
    this.turt.position = vec3.fromValues(5, 0, -100);     
    this.turt.direction = vec3.fromValues(0, 1, 0);   
    this.turt.orientation = vec3.fromValues(0, 0, 0); 
    this.turt.depth = 0;

    this.positions = [];
    this.orientations = [];
    this.instances = [];

    // Push initial position and orientation
    //this.positions.push(vec3.fromValues(this.turt.position[0], this.turt.position[1], this.turt.position[2]));
    //this.orientations.push(vec3.fromValues(this.turt.orientation[0], this.turt.orientation[1], this.turt.orientation[2]));
  }

  render() {
    this.clearTurtleState();
    // Iterate through list of symbols 
    //console.log("Nodes to render: ", this.symbolList.nodes);
    for (let i = 0; i < this.symbolList.nodes.length; i++) {
        //console.log("Turtle Positions: ", this.positions);
        let sym = this.symbolList.nodes[i].character;
        // Query drawing rules map for drawing command that corresponds with symbol
        // If a command exists, execute it
        let drawRule = this.drawMap.drawingRules.get(sym);
        //console.log("Render rule: ", sym, drawRule);
        let drawCmd = null;
        if (drawRule) {
          drawCmd = drawRule.postconditions[0].drawCmd; // TODO: choose based on probability, will need to iterate when there is more than one
        }
        //console.log(i, sym, drawCmd);
        if (drawCmd) { 
            let addOffset : number = drawCmd();
            if (addOffset) this.addTurtleInstance(this.depth);
        }
    }
  }

  addTurtleInstance(iter : number) {
    let turtleInstance : TurtleInstance = new TurtleInstance(this.turt.position, this.turt.orientation, iter);
    //Add current position and orientation to vectors for instanced rendering
    this.instances.push(turtleInstance);
    //this.positions.push(vec3.fromValues(this.turt.position[0], this.turt.position[1], this.turt.position[2]));
    //console.log("Positions: ", this.positions);
    //this.orientations.push(vec3.fromValues(this.turt.orientation[0], this.turt.orientation[1], this.turt.orientation[2]));
    //console.log("Orientations: ", this.orientations);
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
    //console.log("Push depth: ", this.depth);
    return 0;
  }

  popState() {
    this.turt = this.turtleStates.pop();
    this.depth--
    //console.log("Pop depth: ", this.depth);
    return 0;
  }
};

export default LsystemRenderer;