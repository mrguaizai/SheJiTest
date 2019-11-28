cc.Class({
    extends: cc.Component,
    properties: {},
    onLoad() {
        //方向开关
        this.accLeft = false;
        this.accRight = false;
        this.accJump = true;
        // 主角当前水平方向速度
        this.xSpeed = 5;
        this.ySpeed = 200;
        //最大跳跃高度
        this.maxJumpH = 60;

        cc.director.getPhysicsManager().enabled = true;
        cc.director.getPhysicsManager().debugDrawFlags = false;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            console.log(event);
        }, this);

        this.nodebody = this.node.getComponent(cc.RigidBody);
    },
    onBeginContact(contact, selfCollider, otherCollider) {
        if (selfCollider.tag == 0 && otherCollider.tag == 0) {
            let bodyGroup0 = selfCollider.node.group;
            let bodyGroup1 = otherCollider.node.group;
            if ((bodyGroup0 == "floor" && bodyGroup1 == "hero") || (bodyGroup1 == "floor" && bodyGroup0 == "hero")) {
                this.accJump = true;
            }
        }
    },
    update(dt) {
        if (this.accLeft) {
            this.node.x -= this.xSpeed;
        } else if (this.accRight) {
            this.node.x += this.xSpeed;
        }
    },
    onKeyDown: function (event) {
        switch (event.keyCode) {
            case cc.macro.KEY.a:
                this.accLeft = true;
                break;
            case cc.macro.KEY.d:
                this.accRight = true;
                break;
            case cc.macro.KEY.space:
                if (this.accJump) {
                    this.accJump = false;
                    // 给主角y轴正方形200的速度，然后受重力下落
                    var speed_xy = this.nodebody.linearVelocity;
                    speed_xy.y = this.ySpeed;
                    this.nodebody.linearVelocity = speed_xy;
                }
                break;
        }
    },
    onKeyUp: function (event) {
        switch (event.keyCode) {
            case cc.macro.KEY.a:
                this.accLeft = false;
                break;
            case cc.macro.KEY.d:
                this.accRight = false;
                break;
        }
    },
    onTouchMove(event) {
        this.mousePos = event.getLocation;
    },
    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },
});