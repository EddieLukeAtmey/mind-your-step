import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Script')
export class Script extends Component {
    start() {
        console.info('Hello world');
    }

    update(deltaTime: number) {

    }
}

