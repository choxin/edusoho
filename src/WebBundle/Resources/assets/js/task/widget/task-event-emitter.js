import Messenger from "es-messenger";

export default class TaskEventEmitter {
  constructor(element) {
    this.element = $(element);
    this.eventUrl = this.element.data('eventUrl');
    if (this.eventUrl === undefined) {
      throw Error('task event url is undefined');
    }

    this.eventMap = {
      receives: {}
    };

    this.receiveMessenger = new Messenger('parent', 'ActivityEvent');
    this.receiveMessenger.addTarget(this.element.get(0).contentWindow, 'task-content-iframe');

    this.receiveMessenger.listen(message => {
      let {event, data} = JSON.parse(message);
      let listeners = this.eventMap.receives[event];
      $.post(this.element.data('eventUrl'), {eventName: event, data: data})
          .done(({event, data}) => {
            if (typeof listeners !== 'undefined') {
              listeners.forEach(callback => callback(data));
            }
            this.receiveMessenger.send(JSON.stringify({event: event, data: data}));
          })
          .fail((error) => {
            this.receiveMessenger.send(JSON.stringify({event: event, error: error}));
          })
    });

    this.emitMessenger = new Messenger('parent', 'TaskEvent');
    this.emitMessenger.addTarget(this.element.get(0).contentWindow, 'task-content-iframe');

  }

  //发送事件到activity
  emit(event, data) {
    return new Promise((resolve, reject) => {
      $.post(this.eventUrl, {eventName: event, data: data})
          .done((response) => {
            this.emitMessenger.send(JSON.stringify({event: response.event, data: response.data}));
            resolve(response.data);
          })
          .fail((error) => {
            reject(error);
          });
    });
  }

  // 监听activity的事件
  receive(event, callback) {
    this.eventMap.receives[event] = this.eventMap.receives[event] || [];
    this.eventMap.receives[event].push(callback);
  }
}