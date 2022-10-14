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
	postconditions: Array<ExpansionPostcondition> = [];
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
    let pcond1 = new ExpansionPostcondition("AB", 1.0);
    let pcond2 = new ExpansionPostcondition("A", 1.0);

    let rule1 = new ExpansionRule();
    let rule2 = new ExpansionRule();

    rule1.postconditions.push(pcond1);
    rule2.postconditions.push(pcond2);

    this.grammar.expansionRules.set('A', rule1);
    this.grammar.expansionRules.set('B', rule2);
  }

  applyRule(precondition : string) {
    let expRule = this.grammar.expansionRules.get(precondition);
    let postcondition = expRule.postconditions[0].sym; // TODO: choose based on probability, will need to iterate when there is more than one
    return postcondition;
  }

  parse(iterations : number) {
    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < this.axiom.nodes.length; j++) {
        // Find rule that corresponds to current symbol in grammar
        let curr_sym = this.axiom.nodes[i];
        let new_sym = this.applyRule(curr_sym.sym.character);
        this.axiom.expandNode(new_sym, i);
      }
    }
  }
};

export default LsystemParser;