import { _decorator, Component, Vec3, EventMouse, EventTouch, Node, input, Input, Animation } from "cc";
const { ccclass, property } = _decorator;

export const BLOCK_SIZE = 40;

@ccclass('PlayerController')
export class PlayerController extends Component {

    @property(Animation)
    BodyAnim:Animation = null;

    @property(Node)
    leftTouch: Node = null;

    @property(Node)
    rightTouch: Node = null;

    private _curMoveIndex: number = 0;

    //used to judge if the player is jumping.
    private _startJump: boolean = false;

    //the number of steps will the player jump, should be 1 or 2. determined by which mouse button is clicked.
    private _jumpStep: number = 0;

    //the time it takes for the player to jump once.
    private _jumpTime: number = 0.1;

    //the time that the player's current jump action has taken, should be set to 0 each time the player jumps, when it reaches the value of `_jumpTime`, the jump action is completed.
    private _curJumpTime: number = 0;

    // The player's current vertical speed, used to calculate the Y value of position when jumping.
    private _curJumpSpeed: number = 0;

    // The current position of the player, used as the original position in the physics formula.
    private _curPos: Vec3 = new Vec3();

    //movement calculated by deltaTime.
    private _deltaPos: Vec3 = new Vec3(0, 0, 0);

    // store the final position of the player, when the player's jumping action ends, it will be used directly to avoid cumulative errors.
    private _targetPos: Vec3 = new Vec3();

    private _isTouchDevice = cc.sys.isMobile;

    start() {
        console.info('Loaded PlayerController');
        // input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    reset() {
        this._curMoveIndex = 0;
    }

    setInputActive(active: boolean) {
        if (active) {
            //for pc
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            //for mobile
            this.leftTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            this.rightTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        } else {
            //for pc
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            //for mobile
            this.leftTouch.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
            this.rightTouch.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        }
    }

    update(deltaTime: number) {
        //we only do something when the player is jumping.
        if (this._startJump) {
            //accumulate the jumping time.
            this._curJumpTime += deltaTime;
            //check if it reaches the jump time.
            if (this._curJumpTime > this._jumpTime) {
                // When the jump ends, set the player's position to the target position.
                this.node.setPosition(this._targetPos);
                //clear jump state
                this._startJump = false;
                this.onOnceJumpEnd();
            } else {
                //if it still needs to move.
                // copy the position of the node.
                this.node.getPosition(this._curPos);
                //calculate the offset x by using deltaTime and jumping speed.
                this._deltaPos.x = this._curJumpSpeed * deltaTime;
                //calculate the final pos by adding deltaPos to the original position
                Vec3.add(this._curPos, this._curPos, this._deltaPos);
                //update the position of the player.
                this.node.setPosition(this._curPos);
            }
        }
    }

    onMouseUp(event: EventMouse) {
        if (this._isTouchDevice) { return; }

        if (event.getButton() === EventMouse.BUTTON_LEFT) {
            console.info('onMouseUp BUTTON_LEFT');
            this.jumpByStep(1);
        } else if (event.getButton() === EventMouse.BUTTON_RIGHT) {
            console.info('onMouseUp BUTTON_RIGHT');
            this.jumpByStep(2);
        }
    }

    onTouchStart(event: EventTouch) {
        if (!this._isTouchDevice) { return; }

        const target = event.target as Node;
        if (target?.name == 'LeftTouch') {
            console.info('onTouchStart LeftTouch');
            this.jumpByStep(1);
        } else {
            console.info('onTouchStart rightTouch');
            this.jumpByStep(2);
        }
    }

    jumpByStep(step: number) {

        if (this._startJump) {
            //if the player is jumping, do nothing.
            return;
        }

        // Get jump time from animation duration.
        const clipName = step == 1 ? 'oneStep' : 'twoStep';
        const state =  this.BodyAnim.getState(clipName);
        this._jumpTime = state.duration / state.speed;

        //mark player is jumping.
        this._startJump = true;
        //record the number of steps the jumping action will take.
        this._jumpStep = step;
        //set to 0 when a new jumping action starts
        this._curJumpTime = 0;
        //because the player will finish the jumping action in the fixed duration(_jumpTime), so it needs to calculate jump speed here.
        this._curJumpSpeed = this._jumpStep * BLOCK_SIZE / this._jumpTime;
        //copy the current position of the node which will be used when calculating the movement.
        this.node.getPosition(this._curPos);
        //calculate the final position of the node which will be used when the jumping action ends.
        Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep * BLOCK_SIZE, 0, 0));

        if (this.BodyAnim) {
            this.BodyAnim.play(clipName);
        }

        this._curMoveIndex += step;
    }

    onOnceJumpEnd() {
        this.node.emit('JumpEnd', this._curMoveIndex);
        console.info('JumpEnd ' + this._curMoveIndex);
    }
}
