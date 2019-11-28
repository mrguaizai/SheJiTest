cc.Class({
    extends: cc.Component,

    properties: {

    },
    onCollisionEnter: function (other, self) {
        this.contactFunction(self, other);
    },
    contactFunction(self,other){
        this.callBack(self,other);
    },
    colliderCallBack(callBack) {
        this.callBack = callBack;
    },
});