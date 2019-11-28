cc.Class({
    extends: cc.Component,
    properties: {
        bigImg: cc.SpriteAtlas,
    },
    playAnim(nameStr, count, dt, isLoop) {
        this.stopAnim();
        this.node.getComponent(cc.Sprite).spriteFrame = this.bigImg.getSpriteFrame(nameStr + 0);

        let array = [];
        for (let i = 0; i < count; i++) {
            array.push(cc.delayTime(dt));
            array.push(cc.callFunc(() => {
                this.node.getComponent(cc.Sprite).spriteFrame = this.bigImg.getSpriteFrame(nameStr + i);
            }));
        }

        if (isLoop) {
            this.node.runAction(cc.repeatForever(cc.sequence(array)));
        } else {
            this.node.runAction(cc.sequence(array));
        }
    },

    stopAnim() {
        this.node.stopAllActions();
    },
});