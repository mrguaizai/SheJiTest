cc.Class({
    extends: cc.Component,

    properties: {
        speed: 10,
    },
    setAngle(curR) {
        this.angle = curR;
    },
    update() {
        if (this.angle) {
            this.node.x += this.speed;
            this.node.y += Math.tan(this.angle) * this.speed;
        }
    },

});