cc.Class({
    extends: cc.Component,

    properties: {
        bgImg: cc.Node,
        sunImg: cc.Node,
        moonImg: cc.Node,
        floorParent: cc.Node,
        farHouseImg0: cc.Node,
        farHouseImg1: cc.Node,
        nearHouseImg0: cc.Node,
        nearHouseImg1: cc.Node,
        farFloorImg0: cc.Node,
        farFloorImg1: cc.Node,
        nearFloorImg0: cc.Node,
        nearFloorImg1: cc.Node,
        bulletHolder: cc.Node,
        scoreText: cc.Label,

        //我方英雄组件
        heroNode: cc.Node,
        shootLineImg: cc.Node,
        myBulletImg: cc.Node,
        myHeroImg: cc.Node,
        myGunImg: cc.Node,
        shieldImg: cc.Node,
        bloodBar: cc.ProgressBar,
        heroDieParticle: cc.ParticleSystem,

        //结束层
        endLayer: cc.Node,
        bestScoreText: cc.Label,
        allScoreText: cc.Label,

        myBulletPrefab: {
            default: [],
            type: cc.Prefab,
        },
        enemyPrefab: cc.Prefab,
    },

    onLoad() {
        this._winSize = cc.winSize;
        this._canShooting = true; //是否能射击
        this._canContact = true; //是否检测碰撞
        this._curScore = 0; //当前得分
        this._heroBloodValue = 100; //当前血量值

        cc.director.getCollisionManager().enabled = true;
        cc.director.getCollisionManager().enabledDebugDraw = false;

        // 重力加速度的配置
        cc.director.getPhysicsManager().gravity = cc.v2(0, -640);

        //随机获取一种类型
        this.randStyle = Math.floor(Math.random() * 100) % 3;
        // cc.sys.localStorage.setItem("gunHeroBgStyle", this.randStyle);

        //角色类型
        this.heroType = parseInt(cc.sys.localStorage.getItem("gunHeroType")) || 0;

        console.log(123456);

        //修改辅助线纹理
        this.setImgTexture("imageRes/line" + this.heroType, this.shootLineImg);

        //修改大炮纹理
        this.setImgTexture("imageRes/gun" + this.heroType, this.myGunImg);

        //游戏背景
        this.setImgTexture("bg/bgImg" + this.randStyle, this.bgImg);

        //太阳图片  
        if (this.randStyle == 2) {
            this.sunImg.active = false;
            this.moonImg.active = true;
        } else {
            this.moonImg.active = false;
            this.sunImg.active = true;
            this.setImgTexture("imageRes/sun" + this.randStyle, this.sunImg);
        }

        //远处房子
        this.setImgTexture("imageRes/house" + this.randStyle, this.farHouseImg0);
        this.setImgTexture("imageRes/house" + this.randStyle, this.farHouseImg1);

        //近处房子
        this.setImgTexture("imageRes/houshSmall" + this.randStyle, this.nearHouseImg0);
        this.setImgTexture("imageRes/houshSmall" + this.randStyle, this.nearHouseImg1);

        //远处地面
        this.setImgTexture("imageRes/floor" + this.randStyle, this.farFloorImg0);
        this.setImgTexture("imageRes/floor" + this.randStyle, this.farFloorImg1);

        //近处地面
        this.setImgTexture("imageRes/gameFloor" + this.randStyle, this.nearFloorImg0);
        this.setImgTexture("imageRes/gameFloor" + this.randStyle, this.nearFloorImg1);
        this.nearFloorImg0.zIndex = 5;
        this.nearFloorImg1.zIndex = 5;

        //得分
        this.scoreText.string = "0";

        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);

        //云动画
        this.yunAnim();

        //创建敌人
        this.createEnemy();
    },

    createEnemy() {
        let node = cc.instantiate(this.enemyPrefab);
        node.parent = this.floorParent;
        let floorY = -this._winSize.height / 2 + this.nearFloorImg0.height;
        node.position = cc.v2(0, floorY);
        this._enemyNode = node.getComponent("enemy");
        this._enemyNode.comeOnAnim();

        this._enemyNode.finishCallBack(() => {
            node.removeFromParent();
            node.destory;
            node = null;
            this.createEnemy();
        });
    },

    yunAnim() {
        let curWidth = -this._winSize.width / 2;
        while (curWidth < this._winSize.width / 2) {
            //随机一个类型
            let t = Math.floor(Math.random() * 100) % 3;
            //随机一个高度值
            let h = Math.random() * (this._winSize.height * 1 / 6) + this._winSize.height * 2 / 8;
            curWidth = curWidth + Math.random() * 150 + 150;

            let yunNode = new cc.Node();
            let yunSp = yunNode.addComponent(cc.Sprite);
            yunNode.parent = this.floorParent;
            yunNode.position = cc.v2(curWidth, h);
            this.setImgTexture("imageRes/yun" + this.randStyle + "_" + t, yunSp);
            yunNode.runAction(cc.repeatForever(cc.sequence(cc.moveBy(1.0, cc.v2(-20, 0)), cc.callFunc(() => {
                if (yunNode.position.x < -this._winSize.width / 2 - 100) {
                    yunNode.position = cc.v2(this._winSize.width / 2 + 100, yunNode.position.y);
                }
            }))));
        }
    },

    //给自己的子弹绑定刚体
    setBulletBody: function () {
        //创建子弹
        this.bulletNode = cc.instantiate(this.myBulletPrefab[this.heroType]);
        this.bulletNode.parent = this.bulletHolder;
        let curR = this.myGunImg.angle;
        this.bulletNode.angle = curR;
        let myBulletImgPos = this.myBulletImg.parent.convertToWorldSpaceAR(this.myBulletImg.getPosition());
        this.bulletNode.position = myBulletImgPos;
        let autoMove = this.bulletNode.getComponent("EF_AutoMove");
        autoMove.setAngle(curR);
        let bulletSp = this.bulletNode.getComponent("contact");
        bulletSp.colliderCallBack((selfCollider, otherCollider) => {
            this.playSound("sound/openFire", false);

            let bodyGroup0 = selfCollider.node.group;
            let bodyGroup1 = otherCollider.node.group;

            //子弹打到地面
            if ((bodyGroup0 == "heroBullet" && bodyGroup1 == "floor") ||
                (bodyGroup0 == "floor" && bodyGroup1 == "heroBullet")) {
                this.node.runAction(cc.sequence(cc.delayTime(0.1), cc.callFunc(() => {
                    if (this.bulletNode) {
                        this.bulletNode.removeFromParent();
                        this.bulletNode.destroy;
                        this.bulletNode = null;
                    }
                })));
            }

            //子弹打到柱子
            if ((bodyGroup0 == "heroBullet" && bodyGroup1 == "column") ||
                (bodyGroup0 == "column" && bodyGroup1 == "heroBullet")) {
                this.node.runAction(cc.sequence(cc.delayTime(0.1), cc.callFunc(() => {
                    if (this.bulletNode) {
                        this.bulletNode.removeFromParent();
                        this.bulletNode.destroy;
                        this.bulletNode = null;
                    }
                })));
            }

            //子弹打到敌人
            if ((bodyGroup0 == "heroBullet" && bodyGroup1 == "enemy") ||
                (bodyGroup0 == "enemy" && bodyGroup1 == "heroBullet")) {
                this._enemyNode.enemyDie();
                this.node.runAction(cc.sequence(cc.delayTime(0.1), cc.callFunc(() => {
                    if (this.bulletNode) {
                        this.bulletNode.removeFromParent();
                        this.bulletNode.destroy;
                        this.bulletNode = null;
                    }
                    this.updateScore();
                    this.myHeroAnim(true);
                    this.myHeroScaleAnim();
                    this.gameBgAnim();
                    this._enemyNode.enemyMove();
                })));
            }
        });
    },

    //我方英雄运动
    myHeroAnim: function (isRun) {
        if (isRun) {
            this.myHeroImg.getComponent("spriteFrameAnim").playAnim("heroRun" + this.heroType + "_", 5, 0.06, true);
        } else {
            this.myHeroImg.getComponent("spriteFrameAnim").playAnim("heroWait" + this.heroType + "_", 3, 0.1, true);
        }
    },

    //我方英雄缩放效果
    myHeroScaleAnim: function () {
        this.heroNode.runAction(cc.sequence(cc.scaleTo(1.0, 1.1), cc.scaleTo(1.0, 1.0)));
    },

    //背景运动
    gameBgAnim: function () {
        //远处房子
        let fw = this.farHouseImg0.width;
        this.farHouseImg0.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-200, 0)), cc.delayTime(0.1), cc.callFunc(() => {
            if (this.farHouseImg0.position.x <= -fw - this._winSize.width / 2) {
                this.farHouseImg0.position = cc.v2(this.farHouseImg1.position.x + fw, this.farHouseImg0.position.y);
            }
            this.myHeroAnim(false);
        })));
        this.farHouseImg1.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-200, 0)), cc.delayTime(0.1), cc.callFunc(() => {
            if (this.farHouseImg1.position.x <= -fw - this._winSize.width / 2) {
                this.farHouseImg1.position = cc.v2(this.farHouseImg0.position.x + fw, this.farHouseImg1.position.y);
            }
        })));

        //近处房子
        let nw = this.nearHouseImg0.width;
        this.nearHouseImg0.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-300, 0)), cc.delayTime(0.1), cc.callFunc(() => {
            if (this.nearHouseImg0.position.x <= -nw - this._winSize.width / 2) {
                this.nearHouseImg0.position = cc.v2(this.nearHouseImg1.position.x + nw, this.nearHouseImg0.position.y);
            }
        })));
        this.nearHouseImg1.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-300, 0)), cc.delayTime(0.1), cc.callFunc(() => {
            if (this.nearHouseImg1.position.x <= -nw - this._winSize.width / 2) {
                this.nearHouseImg1.position = cc.v2(this.nearHouseImg0.position.x + nw, this.nearHouseImg1.position.y);
            }
        })));

        //远处地面
        let ffw = this.farFloorImg0.width;
        this.farFloorImg0.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-400, 0)), cc.delayTime(0.1), cc.callFunc(() => {
            if (this.farFloorImg0.position.x <= -ffw - this._winSize.width / 2) {
                this.farFloorImg0.position = cc.v2(this.farFloorImg1.position.x + ffw, this.farFloorImg0.position.y);
            }
        })));
        this.farFloorImg1.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-400, 0)), cc.delayTime(0.1), cc.callFunc(() => {
            if (this.farFloorImg1.position.x <= -ffw - this._winSize.width / 2) {
                this.farFloorImg1.position = cc.v2(this.farFloorImg0.position.x + ffw, this.farFloorImg1.position.y);
            }
        })));

        //近处地面
        let nfw = this.nearFloorImg0.width;
        for (let i = 0; i < 100; i++) {
            this.nearFloorImg0.runAction(cc.sequence(cc.delayTime(0.02 * i), cc.callFunc(() => {
                if (i % 9 == 0) {
                    this.playSound("sound/walk", false);
                }
                let pX1 = this.nearFloorImg0.position.x - 4;
                this.nearFloorImg0.position = cc.v2(pX1, this.nearFloorImg0.position.y);

                let pX2 = this.nearFloorImg1.position.x - 4;
                this.nearFloorImg1.position = cc.v2(pX2, this.nearFloorImg1.position.y);

                if (pX1 <= -nfw - this._winSize.width / 2) {
                    this.nearFloorImg0.position = cc.v2(this.nearFloorImg1.position.x + nfw, this.nearFloorImg0.position.y);
                }
                if (pX2 <= -nfw - this._winSize.width / 2) {
                    this.nearFloorImg1.position = cc.v2(this.nearFloorImg0.position.x + nfw, this.nearFloorImg1.position.y);
                }
            })));
        }
    },


    onTouchStart(event) {
        this.playSound("sound/heroBullet", false);
        this.setBulletBody();
    },

    onMouseMove(event) {
        this.mousePos = event.getLocation();
        this.updateGunAngle();
    },

    updateGunAngle() {
        if (this.mousePos) {
            let x = 0;
            let y = 0;
            let angle = 0;
            let curPos = this.heroNode.position;
            if (this.mousePos.x > curPos.x) {
                x = this.mousePos.x - curPos.x;
            }
            if (this.mousePos.y > curPos.y) {
                y = this.mousePos.y - curPos.y;
            }
            angle = Math.atan2(y, x) * 180 / Math.PI;
            this._curAngle = angle;
            this.myGunImg.angle = angle;
        }
    },

    //刷新得分
    updateScore: function () {
        this._curScore += 1;
        this.scoreText.string = this._curScore;
        this.playSound("sound/addScore", false);
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

    //更换纹理
    setImgTexture: function (str, node) {
        cc.loader.loadRes(str, cc.SpriteFrame, function (err, spriteFrame) {
            if (err) {
                cc.error(err.message || err);
                return;
            }
            node.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }.bind(this));
    },

    update() {},

});