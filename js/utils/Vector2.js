/**
 * 2D Vector utility class for game math
 */
export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Create a copy of this vector
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * Set vector components
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Copy from another vector
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    /**
     * Add another vector
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Subtract another vector
     */
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Multiply by scalar
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divide by scalar
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * Get vector magnitude (length)
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Get squared magnitude (faster, good for comparisons)
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Normalize vector to unit length
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    /**
     * Limit vector magnitude
     */
    limit(max) {
        if (this.magnitudeSquared() > max * max) {
            this.normalize().multiply(max);
        }
        return this;
    }

    /**
     * Get distance to another vector
     */
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get angle of vector in radians
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Rotate vector by angle in radians
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Dot product with another vector
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Linear interpolation to another vector
     */
    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        return this;
    }

    /**
     * Check if vectors are equal
     */
    equals(v) {
        return this.x === v.x && this.y === v.y;
    }

    /**
     * Create vector from angle and magnitude
     */
    static fromAngle(angle, magnitude = 1) {
        return new Vector2(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /**
     * Get angle between two vectors
     */
    static angleBetween(v1, v2) {
        return Math.atan2(v2.y - v1.y, v2.x - v1.x);
    }

    /**
     * Add two vectors and return new vector
     */
    static add(v1, v2) {
        return new Vector2(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * Subtract two vectors and return new vector
     */
    static subtract(v1, v2) {
        return new Vector2(v1.x - v2.x, v1.y - v2.y);
    }

    /**
     * Random vector with given magnitude
     */
    static random(magnitude = 1) {
        const angle = Math.random() * Math.PI * 2;
        return Vector2.fromAngle(angle, magnitude);
    }
}
