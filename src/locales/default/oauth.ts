const oauth = {
  consent: {
    buttons: {
      accept: '授权',
      deny: '拒绝',
    },
    description: '应用 {{clientName}} 申请您的账户授权',

    error: {
      sessionInvalid: {
        message: '授权会话已过期或无效，请重新发起授权流程。',
        title: '授权会话无效',
      },
      title: '发生错误',
      unsupportedInteraction: {
        message: '不支持的交互类型: {promptName}',
        title: '不支持的交互类型',
      },
    },
    permissionsTitle: '请求以下权限：',
    redirectUri: '授权成功后将重定向到',
    scope: {
      'email': '访问您的电子邮件地址',
      'offline_access': '允许客户端访问您的数据',
      'openid': '使用您的 Agents Chat 账户进行身份验证',
      'profile': '访问您的基本资料信息（名称、头像等）',
      'sync-read': '读取您的同步数据',
      'sync-write': '写入并更新您的同步数据',
    },
    title: '授权 {{clientName}}',
  },
  failed: {
    backToHome: '返回首页',
    subTitle: '您已拒绝授权应用访问您的 Agents Chat 账户',
    title: '授权被拒绝',
  },
  handoff: {
    desc: {
      processing: '应用正在处理授权，即将跳转下一个页面...',
      success: '已尝试打开桌面应用。如果应用未自动打开，请手动切换。您可以稍后关闭此浏览器窗口。',
    },
    title: {
      processing: '授权处理中...',
      success: '授权已完成',
    },
  },
  login: {
    button: '确认登录',
    description: '应用 {{clientName}} 申请使用您的账户进行登录',
    title: '登录 {{clientName}}',
    userWelcome: '欢迎回来，',
  },
  success: {
    subTitle: '您已成功授权应用访问您的 Agents Chat 账户，可以关闭该页面了',
    title: '授权成功',
  },
};

export default oauth;
