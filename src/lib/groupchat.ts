import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Request } from './request';
// import * as markdown from 'showdown';
import * as moment from 'moment'
// let converter = new markdown.Converter();

moment.locale('zh-CN');

@Injectable()

export class GroupChatService extends Request {
  key = 'friends'
  socket
  userMessage
  static MIN_MINUTES = 10 * 60 * 6000

  subscribers = {

  };

  constructor(protected http: Http) {
    super(http);
    this.subscribeGroupMessage(message => {
      var group = message.group;
      console.log('group', group);
      var subscribers = this.subscribers[group.id];
      console.log(subscribers);
      if (subscribers && subscribers.length) {
        console.log('subscribe found', subscribers);
        for (var i = 0; i < subscribers.length; i++) {
          var cb = subscribers[i];
          console.log('callback found');
          cb && cb(message);
        }
      }
    });
  }

  getUsers(user) {
    var id = user.user ? user.user.id : user.id;
    return JSON.parse(localStorage.getItem(this.key + '_' + id));
  }
  recent(user) {
    return this.getUsers(user);
  }

  addUser(user, message) {
    console.log(message);
    if (!user) {
      return;
    }
    if (message && message.sender.email !== user.friend.email) {
      return;
    }
    var users = this.getUsers(user.user) || [];
    var extracted = user;
    users = users.filter(function (item) {
      if (item.friend.email === user.friend.email) {
        extracted = item;
      }
      return item.friend.email !== user.friend.email
    });
    if (extracted.message) {
      if (message.createdAt > extracted.message.createdAt) {
        extracted.message = message;
      }
    } else {
      extracted.message = message;
    }
    if (message && message.createdAt) {
      extracted.timeStatus = moment(message.createdAt).format('MM-DD HH:mm');
    }

    console.log('updated friend info');
    users.unshift(extracted);
    localStorage.setItem(this.key + '_' + user.user.id, JSON.stringify(users));
  }

  sendMessage(group, text) {
    console.log('group send', group, text);
    return this._post('/group/message/send', {
      group: String(group.id),
      text: text
    });
  }

  readMessage(group, messages) {
    var read = this._get('/group/message/list?group=' + group);
    read.subscribe(json => {
      if (!json.code) {
        // messages = messages.map(function (item) {
        //   if (ids.indexOf(item.id) !== -1) {
        //     item.read = true;
        //   }
        //   return item;
        // });
      }
    });
  }

  removeMessage(user, message, messages) {
    var read = this._post('/message/remove', {
      id: String(message.id)
    });
    read.subscribe(json => {
      if (!json.code) {
        messages = messages.filter(function (item) {
          return item.id !== message.id;
        });
      }
    });
  }

  getMessageList(group, page) {
    page = page > 1 ? page : 1;
    var url = '/group/message/list?group=' + group.id + '&page=' + page;
    return this._get(url);
  }

  subscribe(group, cb) {
    console.log('subscribe group messages', group);
    var subs = this.subscribers[group.id];
    if (!subs) {
      this.subscribers[group.id] = [];
    }
    this.subscribers[group.id].push(cb);
    this.subscribers[group.id] = this.uniqueArr(this.subscribers[group.id]);
  }


}