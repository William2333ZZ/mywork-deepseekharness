# dsh-mywork-im

主动向 IM 频道发消息 for DeepSeek Harness。配合 [`@michengai/dsh-im-connect`](https://github.com/MichengAI/dsh-im-connect)（微信 / 飞书 / Lark / 钉钉 / 企业微信 / QQ / Telegram）使用。

## 原理

IM 插件把每个聊天映射成一个 dsh 会话，并把该会话里助手的回复投递回聊天，但没有对外的"发送"接口。本插件通过 dsh 官方的 session controller 往那个会话里提交一条**转发指令**（"把下面内容原样发给用户"），会话的助手照发，IM 插件负责送达。所以：

- 只能发给**已经给机器人发过消息**的聊天（映射由第一条消息创建）。
- 送达要经过一次模型回合，通常几秒；内容按原样转发，偶尔会被模型轻微改动。

## 入口

- 模型工具 `im_send({ text, target? })`、`im_chats()`；系统提示词里告诉模型可以用它通知你。**定时任务**：在任务描述里写"完成后用 im_send 把结果发到微信"即可。
- 命令 `/imsend [weixin|feishu|账号名] <文本>`。
- 页面：侧栏 IM助理 页顶部的「主动发消息到频道」卡片（选聊天、写内容、发送）。
- HTTP：`/mywork-im/api/chats`、`POST /mywork-im/api/send {target, text}`（同源 + 登录）。
- 提醒：dsh-mywork-schedule 的提醒可勾选「到点也发到 IM」。

`target`：平台名（weixin / feishu…）、账号名、聊天 id 或标题片段。**多账号 / 多聊天时绝不猜**：只有一个可用聊天时才允许省略；平台名或账号名命中多个聊天（比如两个微信账号、一个账号下多个私聊 / 群）时返回候选列表让调用方指明（用 chatId 最保险）。每个聊天对应独立会话，互不串扰；同一聊天的多条消息按 `queue` 模式排队，不会插进正在进行的回合。

## 配置（cordis.patch.yml，可选）

`tools`（默认 true）、`command`（/imsend，默认 true）、`promptHint`（默认 true）、`maxChars`（默认 4000）。
