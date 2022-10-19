import {vec3, vec4, mat4} from 'gl-matrix';

export class LeafInstance {
  position: vec3 = vec3.create();
  orientation: vec3 = vec3.create();

  constructor(position: vec3, orientation : vec3) {
      this.position = vec3.fromValues(position[0], position[1], position[2]);
      this.orientation = vec3.fromValues(orientation[0], orientation[1], orientation[2]);
  }
}

export class TurtleInstance {
    position: vec3 = vec3.create();
    orientation: vec3 = vec3.create();
    depth: number = 0;

    constructor(position: vec3, orientation : vec3, depth : number) {
        this.position = vec3.fromValues(position[0], position[1], position[2]);
        this.orientation = vec3.fromValues(orientation[0], orientation[1], orientation[2]);
        this.depth = depth;
    }
}

class Turtle {
  position: vec3 = vec3.create();     // Position of turtle (pivot point of cylinder)
  direction: vec3 = vec3.create();    // Orientation expressed as ray direction (not normalized)
  orientation: vec3 = vec3.create();  // Orientation expressed as Euler Angles (X, Y, Z)
  depth: number = 0;

  constructor(position: vec3, direction: vec3, orientation : vec3) {
    this.position = vec3.fromValues(position[0], position[1], position[2]);
    this.direction = vec3.fromValues(direction[0], direction[1], direction[2]);
    this.orientation = vec3.fromValues(orientation[0], orientation[1], orientation[2]);
  }

  moveForward(length : number) {
    let dir : vec3 = vec3.create();
    vec3.add(this.position, this.position, vec3.multiply(dir, this.direction, vec3.fromValues(length, length, length)));
  }

  rotateDirection(angle : number, axis : number) {
    let rotateMat = mat4.create();
    let dirCopy = vec4.fromValues(this.direction[0], this.direction[1], this.direction[2], 0.0);

    // Create rotation matrix that rotates vec4 by angle around axis
    if (axis == 0) {
        mat4.rotateX(rotateMat, rotateMat, angle * (Math.PI / 180.0));
    }
    else if (axis == 1) {
        mat4.rotateY(rotateMat, rotateMat, angle * (Math.PI / 180.0));
    }
    else if (axis == 2) {
        mat4.rotateZ(rotateMat, rotateMat, angle * (Math.PI / 180.0));
    }
    vec4.transformMat4(dirCopy, dirCopy, rotateMat);

    // Place value into this.direction
    vec3.normalize(this.direction, vec3.fromValues(dirCopy[0], dirCopy[1], dirCopy[2]));
  }

  rotateLeft(z : number) {
    let rand : number = Math.random() * 2.0;
    this.rotateDirection(z + rand, 2);
    vec3.add(this.orientation, this.orientation, vec3.fromValues(0, 0, z + rand));
  }

  rotateRight(z : number) {
    let rand : number = Math.random() * 2.0;
    this.rotateDirection(-z + rand, 2);
    vec3.subtract(this.orientation, this.orientation, vec3.fromValues(0, 0, z + rand));
  }

  pitchUp(x : number) {
    this.rotateDirection(x, 0);
    vec3.add(this.orientation, this.orientation, vec3.fromValues(x, 0, 0));
  }

  pitchDown(x : number) {
    this.rotateDirection(-x, 0);
    vec3.subtract(this.orientation, this.orientation, vec3.fromValues(x, 0, 0));
  }

  rollCounterClockwise(y : number) {
    this.rotateDirection(y, 1);
    vec3.add(this.orientation, this.orientation, vec3.fromValues(0, y, 0));
  }

  rollClockwise(y : number) {
    this.rotateDirection(-y, 1);
    vec3.subtract(this.orientation, this.orientation, vec3.fromValues(0, y, 0));
  }
};

export default Turtle;