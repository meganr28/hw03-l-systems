import {vec3, mat4} from 'gl-matrix';

export class SymbolNode {
    character: string;
	iteration: number;

    constructor(c : string, it : number) {
        this.character = c;
        this.iteration = it;
    }
};

class LinkedList {
	nodes: Array<SymbolNode> = [];

    constructor(axiom: string) {
        this.convertToLinkedList(axiom, 0);
    }
	
	convertToLinkedList(axiom: string, iteration : number) {
        this.nodes = [];
        for (let i = 0; i < axiom.length; i++) {
            const sym = axiom.charAt(i);
            let node = new SymbolNode(sym, iteration);

            this.nodes.push(node);
        }
    }

    expandNode(new_sym : string, index : number, iteration : number) {
        if (new_sym == "") return;
        // Create new SymbolNode list from new symbols
        let nodesToInsert = [];
        for (let i = 0; i < new_sym.length; i++) {
            const sym = new_sym.charAt(i);
            let node = new SymbolNode(sym, iteration + 1);

            nodesToInsert.push(node);
        }

        // Replace and insert starting at given index
        let nodesSize : number = this.nodes.length;
        for (let j = 0; j < nodesToInsert.length; j++) {
            if (j == 0) {
                this.nodes[index] = nodesToInsert[j];
            }
            else {
                this.nodes.splice(index + j, 0, nodesToInsert[j]);    
            }
        }
    }

    update(axiom : string) {
        this.convertToLinkedList(axiom, 0);
    }

    toString() {
        let ll_string : string = "";
        for (let i = 0; i < this.nodes.length; i++) {
            let sym = this.nodes[i].character;
            ll_string += sym;
        }
        return ll_string;
    }

	print() {
        console.log("Axiom: ", this.toString());
    }
};

export default LinkedList;