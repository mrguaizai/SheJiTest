cc.Class({
    extends: cc.Component,

    properties: {
        cloumn: cc.Node,
        enemyGunImg: cc.Node,
        enemyBulletImg: cc.Node,
        enemyHeroImg: cc.Node,
        enemyDieParticle: cc.ParticleSystem,
    },
    onLoad: function () {
        this._winSize = cc.winSize;
        this.enemyHeroImg.active = false;
        this.enemyGunImg.active = false;
    },

    //敌人run动画
    enemyAni: function () {
        this.enemyHeroImg.getComponent("spriteFrameAnim").playAnim("enemy", 3, 0.1, true);
    },

    comeOnAnim() {
        this.setColumnHight();
        let w = Math.floor(Math.random() * (this._winSize.width / 4));
        this.cloumn.runAction(cc.sequence(cc.moveTo(1.5, w, this.cloumn.position.y), cc.callFunc(() => {
            this.enemyHeroImg.active = true;
            this.enemyGunImg.active = true;
            this.enemyAni();
        }, this)));
    },

    setColumnHight() {
        //随机获取高度
        let y = Math.floor(Math.random() * -250) - 100;
        this.cloumn.position = cc.v2(this._winSize.width / 2 + 100, y);
    },

    //敌方柱子运动
    enemyMove: function () {
        this.enemyHeroImg.active = false;
        this.enemyGunImg.active = false;
        this.cloumn.runAction(cc.sequence(cc.moveTo(1.0, cc.v2(-this._winSize.width / 2 - 100, this.cloumn.position.y)), cc.callFunc(() => {
            if (this.callBack) {
                this.callBack();
            }
        })));
    },

    //敌方英雄死亡动画
    enemyDie: function () {
        this.enemyDieParticle.node.active = true;
        this.enemyDieParticle.stopSystem();
        this.enemyDieParticle.resetSystem();

        //隐藏敌方英雄
        this.enemyGunImg.active = false;
        this.enemyHeroImg.active = false;
    },

    //播放音效
    playSound: function (name, isLoop) {
        cc.loader.loadRes(name, cc.AudioClip, function (err, clip) {
            if (err) {
                return;
            }
            var audioID = cc.audioEngine.playEffect(clip, isLoop);
        });
    },

      //运动完成的回调
      finishCallBack (callBack){
        this.callBack = callBack;
    },
});