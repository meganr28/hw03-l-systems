import {vec3, mat4} from 'gl-matrix';
import LinkedList from './LinkedList';

export class ExpansionPostcondition {
	sym: string;
	probability: number;

    constructor(s : string, prob : number) {
        this.sym = s;
        this.probability = prob;
    }
};

export class ExpansionRule {
	postconditions: Array<ExpansionPostcondition> = new Array();
};

export class ExpansionRuleMap {
	expansionRules: Map<string, ExpansionRule> = new Map();
};

class LsystemParser {
  axiom: LinkedList;         // this will store the final expanded string
  grammar: ExpansionRuleMap; // rules that determine what symbols appear

  constructor(axiom: string) {
    this.axiom = new LinkedList(axiom);
    this.grammar = new ExpansionRuleMap();

    // Init map rules
    let pcond1 = new ExpansionPostcondition("F+F−F−F+F", 1.0);
    let pcond2 = new ExpansionPostcondition("AB", 1.0);

    let rule1 = new ExpansionRule();
    let rule2 = new ExpansionRule();

    rule1.postconditions.push(pcond1);
    rule2.postconditions.push(pcond2);

    this.grammar.expansionRules.set('F', rule1);
    this.grammar.expansionRules.set('A', rule2);

    this.grammar.expansionRules.forEach((value: ExpansionRule, key: string) => {
        console.log(key, value.postconditions[0]);
    });

    /*for (let i = 0; i < this.axiom.nodes.length; i++) {
      console.log("Axiom Node: ", this.axiom.nodes[i].sym.character);
    }*/    
  }

  applyRule(precondition : string) {
    let expRule = this.grammar.expansionRules.get(precondition);
    if (!expRule) return "";
    let postcondition = expRule.postconditions[0].sym; // TODO: choose based on probability, will need to iterate when there is more than one
    return postcondition;
  }

  parse(iterations : number) {
    //console.log("In Parsing...");
    //console.log("Axiom: ", this.axiom.nodes[0].character);
    for (let i = 0; i < iterations; i++) {
      //console.log("ITERATION: ", i);
      //console.log("Axiom Size: ", this.axiom.nodes.length);
      for (let j = 0; j < this.axiom.nodes.length; j++) {
        //console.log("j: ", j);
        // If not current iteration, skip
        let curr_it = this.axiom.nodes[j].iteration;
        //console.log("Node iteration: ", curr_it);
        if (curr_it != i) continue;

        // Find rule that corresponds to current symbol in grammar
        let curr_sym = this.axiom.nodes[j].character;
        //console.log("Curr Sym: ", curr_sym);
        let new_sym = this.applyRule(curr_sym);
        //console.log("New Sym: ", new_sym);
        this.axiom.expandNode(new_sym, j, i);
        //console.log("Axiom: ", this.axiom.nodes);
      }
    }
  }
};

export default LsystemParser;