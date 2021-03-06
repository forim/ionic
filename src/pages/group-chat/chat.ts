import { Component, ViewChild } from '@angular/core';
import { NavController, ViewController, NavParams, Content } from 'ionic-angular';
import * as markdown from 'showdown';
import * as prism from 'prismjs';
import { GroupChatService } from '../../lib/groupchat'
import * as moment from 'moment'

import { GroupSettingsPage } from '../group-settings/settings';

let converter = new markdown.Converter();

moment.locale('zh-CN');

/*

  Generated class for the Chat page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.

*/

@Component({
  selector: 'page-group-chat',
  templateUrl: 'chat.html',
  queries: {
    content: new ViewChild(Content)
  }
})

export class GroupChatPage {
  @ViewChild(Content) content: Content;
  limit = 20
  page = 1
  group
  message
  messages = []
  end = false
  fetched = false
  lastTime = null
  newMessage = false;
  user
  // 最后消息活动时间
  sending = false
  failed = false
  sendingMessage = ''
  constructor(public navCtrl: NavController,
    public viewCtrl: ViewController,
    public chatService: GroupChatService,
    public navParams: NavParams) {
    this.group = navParams.get('group');
    this.user = navParams.get('user');
    console.log(this.group);
    // From Socket.IO
    this.chatService.subscribe(this.group.group, message => {
      console.log('inside gorup chat message');
      this.newMessage = true;
      this.messages = this.messages.concat(message);
      this.updateFullMessage(this.messages, true);
    });

    this.getMessageList(true);

    // hide tabs when view loads
    this.viewCtrl.didEnter.subscribe(() => {
      this.setCSS('.tabbar', 'display', 'none');
      this.updateMessage(false);
    });

    // show tabs when view exits
    this.viewCtrl.willLeave.subscribe(() => {
      this.setCSS('.tabbar', 'display', 'flex');
    });
  }

  getMessageList(scroll) {
    if (this.end) {
      return;
    }
    // Get Initial Messages
    var sub = this.chatService.getMessageList(this.group.group, this.page++);
    sub.subscribe(json => {
      if (!json.code) {
        var messages = json.data.messages;
        this.fetched = true;
        if (!messages.length) {
          this.end = true;
          return;
        }
        this.newMessage = true;
        if (messages.length < this.limit) {
          this.end = true;
        } else {
          this.end = false;
        }

        messages = this.messages.concat(messages);
        this.updateFullMessage(messages, true);

        // messages = messages.map(function (item) {
        //   item.createdAt = new Date(item.createdAt).getTime();
        //   return item;
        // });
        // messages = messages.sort(function (a, b) {
        //   return a.createdAt - b.createdAt;
        // });
        // messages = messages.map(function (item) {
        //   return this.updateItem(item);
        // }.bind(this));
        // this.messages = messages;
        // this.updateMessage(scroll);
      }
    });
  }
  updateFullMessage(messages, scroll) {
    messages = messages.map(function (item) {
      item.createdAt = new Date(item.createdAt).getTime();
      return item;
    });
    messages = messages.sort(function (a, b) {
      return a.createdAt - b.createdAt;
    });
    messages = messages.map(function (item) {
      return this.updateItem(item);
    }.bind(this));
    this.messages = messages;
    this.updateMessage(scroll);
  }

  updateItem(item) {
    item.timeText = moment(item.createdAt).format('LL[ ]LT');
    item.timeStatus = moment(item.createdAt).format('MM-DD HH:mm');
    item.html = converter.makeHtml(item.text);
    this.onMessage(item);
    if (!this.lastTime || (item.createdAt - this.lastTime) > GroupChatService.MIN_MINUTES) {
      item.timed = true;
    }
    this.lastTime = item.createdAt;
    return item;
  }

  toBottom() {
    setTimeout(function () {
      if (this.content && this.content.scrollToBottom) {
        if (this.content.scrollToBottom instanceof Function) {
          this.content.scrollToBottom();
        }
      }
    }.bind(this), 1);
  }

  onMessage(message) {
    // console.log(message.sender);
    // console.log(this.user);
    if (message.sender.id === this.user.id) {
      message.type = 'to';
    } else {
      message.type = 'from';
    }
  }

  setCSS(selector, key, value) {
    let domElement = document.querySelectorAll(selector);
    if (domElement !== null) {
      Object.keys(domElement).map((k) => {
        domElement[k].style[key] = value;
      });
    } // end if
  }

  scrollToBottom() {

  }

  updateMessage(scroll) {
    if (this.messages && this.messages.length) {
      console.log(this.messages.length);
      setTimeout(function () {
        prism.highlightAll('', function (data) {
        });
        if (scroll && this && this.content && this.content.scrollToBottom) {
          if (this.content.scrollToBottom instanceof Function) {
            this.content.scrollToBottom();
          }
        }
      }.bind(this), 1000);
    }
  }

  ionViewDidLoad() {

  }

  send(sendingMessage = '') {
    this.message = sendingMessage || this.message;

    this.sending = true;
    this.failed = false;
    this.newMessage = false;
    var observable = this.chatService.sendMessage(this.group.group, this.message);
    this.sendingMessage = this.message;
    this.toBottom();
    this.message = '';
    observable.subscribe((json) => {
      this.sending = false;
      if (json.code) {
        this.failed = true;
        return;
      }
      var message = json.data;
      message = this.updateItem(message);

      this.messages.push(message);
      this.updateMessage(true);
    });

    // this.newMessage = false;
    // console.log('send group message');
    // console.log(this.group);
    // var observable = this.chatService.sendMessage(this.group.group, this.message);
    // this.message = '';
    // observable.subscribe((json) => {
    //   setTimeout(() => {
    //     if (this.newMessage) {
    //       this.page = 1;
    //       this.getMessageList(true);
    //     }
    //   }, 1000);
    // });
  }

  keyup(event) {
    console.log('inside key up');
    console.log(event);
    this.send();
  }

  more() {
    this.getMessageList(false);
  }

  settingsGroup(group) {
    this.navCtrl.push(GroupSettingsPage, {
      group: group,
      user: this.user
    });
  }
}


