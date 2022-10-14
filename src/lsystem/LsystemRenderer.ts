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
	drawingRules: Map<string, DrawingRule> = new Map(); // TODO: change this back to DrawingRule
};

class LsystemRenderer {
  symbolList: LinkedList;
  turtleStates: Array<Turtle>;
  drawMap: DrawingRuleMap;
  turt: Turtle; // current state of the turtle

  constructor(symbols: LinkedList) {
    this.symbolList = symbols;
    this.turtleStates = new Array();
    this.drawMap = new DrawingRuleMap();
    this.turt = new Turtle(vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0), 45.0, 1.0);

    // Init map symbols
    let pcond1 = new DrawingPostcondition(this.turt.moveForward.bind(this.turt), 1.0);
    let pcond2 = new DrawingPostcondition(this.turt.rotateLeft.bind(this.turt), 1.0);
    let pcond3 = new DrawingPostcondition(this.turt.rotateRight.bind(this.turt), 1.0);
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

  render() {
    // Iterate through list of symbols 
    for (let i = 0; i < this.symbolList.nodes.length; i++) {
        let sym = this.symbolList.nodes[i].sym;
        // Query drawing rules map for drawing command that corresponds with symbol
        // If a command exists, execute it
        let drawRule = this.drawMap.drawingRules.get(sym.character);
        let drawCmd = drawRule.postconditions[0].drawCmd; // TODO: choose based on probability, will need to iterate when there is more than one
        //console.log(i, sym, drawCmd);
        if (drawCmd) { 
            drawCmd();
        }
    }
  }

  pushState() {
    this.turtleStates.push(this.turt);
    console.log(this.turtleStates[0].position);
  }

  popState() {
    this.turt = this.turtleStates.pop();
  }
};

export default LsystemRenderer;