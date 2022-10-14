import {vec3, vec4, mat4} from 'gl-matrix';

class Turtle {
  position: vec3 = vec3.create();     // Position of turtle (pivot point of cylinder)
  direction: vec3 = vec3.create();    // Orientation expressed as ray direction (not normalized)
  orientation: vec3 = vec3.create();  // Orientation expressed as Euler Angles (X, Y, Z)
  angle: number = 0.0;                 // rotation angle
  length: number = 1.0;               // length of a branch
  depth: number = 0;

  positions: Array<vec3>;
  orientations: Array<vec3>;

  constructor(position: vec3, direction: vec3, angle : number, length: number) {
    this.position = position;
    this.direction = direction;
    this.angle = angle;
    this.length = length;
    this.positions = new Array();
    this.orientations = new Array();
  }

  moveForward() {
    // Add current position and orientation to vectors for instanced rendering
    this.positions.push(vec3.fromValues(this.position[0], this.position[1], this.position[2]));
    this.orientations.push(vec3.fromValues(this.orientation[0], this.orientation[1], this.orientation[2]));
    // Move the turtle
    vec3.add(this.position, this.position, vec3.multiply(this.direction, this.direction, vec3.fromValues(this.length, this.length, this.length)));
}

  rotateDirection() {
    // TODO: ADD X, Y ROTATION TO THIS
    let rotateMat = mat4.create();
    let dirCopy = vec4.fromValues(this.direction[0], this.direction[1], this.direction[2], 0.0);

    // Create Z-rotation matrix that rotates vec4 by this.angle
    mat4.rotateZ(rotateMat, rotateMat, this.angle * (Math.PI / 180.0));
    vec4.transformMat4(dirCopy, dirCopy, rotateMat);

    // Place value into this.direction
    this.direction = vec3.fromValues(dirCopy[0], dirCopy[1], dirCopy[2]);
  }

  rotateLeft(x : number, y : number, z : number) {
    // Rotate direction vector 
    this.rotateDirection();

    vec3.add(this.orientation, this.orientation, vec3.fromValues(x, y, z));
  }

  rotateRight(x : number, y : number, z : number) {
    // Rotate direction vector 
    this.rotateDirection();

    vec3.subtract(this.orientation, this.orientation, vec3.fromValues(x, y, z));
  }
};

export default Turtle;