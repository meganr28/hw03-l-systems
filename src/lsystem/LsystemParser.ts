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

  addRule(rule : string, prob : number) {
    let split_rule = rule.split("=", 2);

    let precondition = split_rule[0];
    let postcondition = new ExpansionPostcondition(split_rule[1], prob);

    if (this.expansionRules.has(precondition)) {
      this.expansionRules.get(precondition).postconditions.push(postcondition);
    }
    else {
      let rule = new ExpansionRule();
      rule.postconditions.push(postcondition);
      this.expansionRules.set(precondition, rule);
    }
    //console.log("Current rules: ", this.expansionRules);
  }

  addRules(new_rules : string[], new_probs : number[]) {
    //console.log("In add rules...");
    //console.log("New rules size: ", new_rules.length);
    this.expansionRules.clear();
    for (let i = 0; i < new_rules.length; i++) {
      this.addRule(new_rules[i], new_probs[i]);
    }

    this.expansionRules.forEach((value: ExpansionRule, key: string) => {
      console.log(key, value.postconditions[0]);
    });
  }

  updateRuleProbability(rule : string, prob : number, index : number) {
    let split_rule = rule.split("=", 2);
    let precondition = split_rule[0];
    let expRule = this.expansionRules.get(precondition);
    //console.log("Update rule exp rule: ", expRule);
    if (expRule) {
      expRule.postconditions[index].probability = prob;
    }
  }
};

class LsystemParser {
  axiom: LinkedList;         // this will store the final expanded string
  grammar: ExpansionRuleMap; // rules that determine what symbols appear
  iterations: number;

  constructor(axiom: string, rules : string[], probabilities : number[], iter : number) {
    this.axiom = new LinkedList(axiom);
    this.grammar = new ExpansionRuleMap();
    this.iterations = iter;

    // Init grammar rules
    this.grammar.addRules(rules, probabilities);

    /*for (let i = 0; i < this.axiom.nodes.length; i++) {
      console.log("Axiom Node: ", this.axiom.nodes[i].sym.character);
    }*/    
  }

  setAxiom(new_axiom : string) {
    this.axiom.update(new_axiom);
  }

  setIterations(iter : number) {
    this.iterations = iter;
  }

  setRules(rules : string[], probabilities : number[]) {
    this.grammar.expansionRules.clear();
    this.grammar.addRules(rules, probabilities);
  }

  applyRule(precondition : string) {
    let expRule = this.grammar.expansionRules.get(precondition);
    // If this rule does not have any postconditions (i.e. not added to map) then return
    if (!expRule) return "";
    //console.log("exp rule: ", expRule);

    // Generate random number
    let rand : number = Math.random();
    let probability_sum : number = 0.0;
    let postcondition : string = "";
    //console.log("Postconditions length: ", expRule.postconditions.length);
    //console.log("Rand: ", rand);
    for (let i = 0; i < expRule.postconditions.length; i++) {
      probability_sum += expRule.postconditions[i].probability;
      if (rand < probability_sum) {
        postcondition = expRule.postconditions[i].sym; // TODO: choose based on probability, will need to iterate when there is more than one
        break;
      }
    }
    //console.log("Postcondition: ", postcondition);
    return postcondition;
  }

  clearAxiom(axiom : string) {
    this.axiom.update(axiom);
  }

  parse() {
    //console.log("In Parsing...");
    //console.log("Axiom: ", this.axiom.nodes);
    //console.log("Num Iterations: ", this.iterations);
    for (let i = 0; i < this.iterations; i++) {
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
    //console.log(this.axiom.nodes);
    return this.axiom;
  }
};

export default LsystemParser;