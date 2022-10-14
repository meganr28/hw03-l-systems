import {vec3, mat4} from 'gl-matrix';

export class Symb {
	character: string;
	iteration: number;

    constructor(c : string, it : number) {
        this.character = c;
        this.iteration = it;
    }
};

export class SymbolNode {
    prev: SymbolNode = null;
	next: SymbolNode = null;
	sym: Symb;

    constructor(s : Symb) {
        this.sym = s;
    }
};

class LinkedList {
	nodes: Array<SymbolNode> = [];

    constructor(axiom: string) {
        this.convertToLinkedList(axiom);
    }
	
	convertToLinkedList(axiom: string) {
        for (let i = 0; i < axiom.length; i++) {
            const c = axiom.charAt(i);
            let sym = new Symb(c, 0);
            let node = new SymbolNode(sym);

            this.nodes.push(node);
        }
    }

    expandNode(new_sym : string, index : number) {
        // Create new SymbolNode list from new symbols
        let nodesToInsert = [];
        for (let i = 0; i < new_sym.length; i++) {
            const c = new_sym.charAt(i);
            let sym = new Symb(c, 0);
            let node = new SymbolNode(sym);

            nodesToInsert.push(node);
        }

        // Replace and insert starting at given index
        for (let j = 0; j < nodesToInsert.length; j++) {
            if (j == 0) {
                this.nodes[index] = nodesToInsert[j];
            }
            else {
                this.nodes.splice(index + j, 0, nodesToInsert[j]);
            }     
        }
    }

	print() {
        for (let i = 0; i < this.nodes.length; i++) {
            let sym = this.nodes[i].sym.character;
            console.log(sym);
        }
    }
};

export default LinkedList;