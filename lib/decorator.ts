import { Subscriber } from 'rxjs';

export interface IDestroySubscribers {
  _addSubscribersFunc?: string;
  _removeSubscribersFunc?: string;
  _onInitSubscriptions?: string;
  _onDestroySubscriptions?: string;
  _subscriptions?: string;
}

export function DestroySubscribers(args?: IDestroySubscribers) {

  return function (target: any) {

    const params: IDestroySubscribers = Object.assign({}, {
      _addSubscribersFunc: 'addSubscribers',
      _removeSubscribersFunc: 'removeSubscribers',
      _onInitSubscriptions: 'ngOnInit',
      _onDestroySubscriptions: 'ngOnDestroy',
      _subscriptions: 'subscribers'
    }, args);

    function decorateComponentMethod(action: () => void) {
      return function(protoFunction: () => any) {
        return function() {
          action.call(this);
          return protoFunction ? protoFunction.apply(this, arguments) : null;
        }
      }
    }

    function subAction(): void {
      if (typeof this[params._addSubscribersFunc] === 'function') {
        this[params._addSubscribersFunc]();
      }
    }

    function destroyAction(): void {
      if (typeof this[params._removeSubscribersFunc] === 'function') {
        this[params._removeSubscribersFunc]();
      }

      const subscriptionKeys = []
        .concat(Object.keys(this[params._subscriptions]))
        .concat(Object.getOwnPropertySymbols(this[params._subscriptions]));

      subscriptionKeys.forEach(key => {
        const subscriber = this[params._subscriptions][key];
        if (subscriber instanceof Subscriber) {
          subscriber.unsubscribe();
        }
      });
   }

    const actionsList: Array<() => void> = [subAction, destroyAction];
    const [initSubDecorator, destroySubDecorator] = actionsList.map(decorateComponentMethod);

    // const initSubDecorator = decorateComponentMethod(subAction);
    // const destroySubDecorator = decorateComponentMethod(destroyAction);

    target.prototype[params._onInitSubscriptions] = initSubDecorator(target.prototype[params._onInitSubscriptions]);
    target.prototype[params._onDestroySubscriptions] = destroySubDecorator(target.prototype[params._onDestroySubscriptions]);

    return target;
  }
}
