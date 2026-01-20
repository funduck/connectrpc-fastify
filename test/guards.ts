import { ConnectRPC, ExecutionContext, Guard } from 'src/index';

export class TestGuard1 implements Guard {
  static callback = (context: ExecutionContext) => true;

  constructor() {
    ConnectRPC.registerGuard(this);
  }

  canActivate(context: ExecutionContext): boolean {
    return TestGuard1.callback(context);
  }
}
