import {vec3, mat4} from 'gl-matrix';
import LinkedList from './LinkedList';
import Turtle from "./Turtle";

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

  positions: Array<vec3>;
  orientations: Array<vec3>;

  constructor(symbols: LinkedList, angle : number, length: number) {
    this.symbolList = symbols;
    this.turtleStates = new Array();
    this.drawMap = new DrawingRuleMap();
    this.turt = new Turtle(vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));
    this.angle = angle;
    this.length = length;

    this.positions = new Array();
    this.orientations = new Array();

    // Init map symbols
    let pcond1 = new DrawingPostcondition(this.moveForward.bind(this), 1.0);
    let pcond2 = new DrawingPostcondition(this.rotateRight.bind(this), 1.0);
    let pcond3 = new DrawingPostcondition(this.rotateLeft.bind(this), 1.0);
    let pcond4 = new DrawingPostcondition(this.pushState.bind(this), 1.0);
    let pcond5 = new DrawingPostcondition(this.popState.bind(this), 1.0);

    let rule1 = new DrawingRule();
    let rule2 = new DrawingRule();
    let rule3 = new DrawingRule();
    let rule4 = new DrawingRule();
    let rule5 = new DrawingRule();

    rule1.postconditions.push(pcond1);
    rule2.postconditions.push(pcond2);
    rule3.postconditions.push(pcond3);
    rule4.postconditions.push(pcond4);
    rule5.postconditions.push(pcond5);

    this.drawMap.drawingRules.set('F', rule1);
    this.drawMap.drawingRules.set('-', rule2);
    this.drawMap.drawingRules.set('+', rule3);
    this.drawMap.drawingRules.set('[', rule4);
    this.drawMap.drawingRules.set(']', rule5);

    /*this.drawMap.drawingRules.forEach((value: DrawingRule, key: string) => {
        console.log(key, value.postconditions[0]);
    });*/
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

  clearTurtleState() {
    this.turt.position = vec3.fromValues(0, 0, 0);     
    this.turt.direction = vec3.fromValues(0, 1, 0);   
    this.turt.orientation = vec3.fromValues(0, 0, 0); 
    this.turt.depth = 0;

    this.positions = [];
    this.orientations = [];

    // Push initial position and orientation
    this.positions.push(vec3.fromValues(this.turt.position[0], this.turt.position[1], this.turt.position[2]));
    this.orientations.push(vec3.fromValues(this.turt.orientation[0], this.turt.orientation[1], this.turt.orientation[2]));
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
            if (addOffset) this.addTurtleOffset();
        }
    }
  }

  addTurtleOffset() {
    //Add current position and orientation to vectors for instanced rendering
    this.positions.push(vec3.fromValues(this.turt.position[0], this.turt.position[1], this.turt.position[2]));
    //console.log("Positions: ", this.positions);
    this.orientations.push(vec3.fromValues(this.turt.orientation[0], this.turt.orientation[1], this.turt.orientation[2]));
    //console.log("Orientations: ", this.orientations);
  }

  moveForward() {
    this.turt.moveForward(this.length);
    return 1;
  }

  rotateLeft() {
    this.turt.rotateLeft(0, 0, this.angle);
    return 0;
  }

  rotateRight() {
    this.turt.rotateRight(0, 0, this.angle);
    return 0;
  }

  pushState() {
    let turtleState = new Turtle(this.turt.position, this.turt.direction);
    this.turtleStates.push(this.turt);
    this.turt = turtleState;
    return 0;
  }

  popState() {
    this.turt = this.turtleStates.pop();
    return 0;
  }
};

export default LsystemRenderer;