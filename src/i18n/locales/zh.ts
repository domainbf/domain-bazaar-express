
export const zh = {
  // 通用词汇
  common: {
    all: '全部',
    refresh: '刷新',
    actions: '操作',
    unknown: '未知',
    search: '搜索',
    filter: '筛选',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    close: '关闭',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
    yes: '是',
    no: '否',
    next: '下一步',
    previous: '上一步',
    submit: '提交',
    reset: '重置',
    back: '返回',
    continue: '继续',
    finish: '完成',
    backToHome: '返回首页',
    changingLanguage: '正在切换语言...',
    languageChangeFailed: '语言切换失败',
    languageChanged: '语言切换成功',
    more: '更多',
    less: '收起',
    view: '查看',
    contact: '联系',
    email: '邮箱',
    phone: '电话',
    name: '姓名',
    description: '描述',
    status: '状态',
    type: '类型',
    date: '日期',
    time: '时间'
  },

  // 导航栏
  nav: {
    home: '首页',
    marketplace: '域名市场',
    dashboard: '仪表盘',
    profile: '个人资料',
    admin: '管理后台',
    login: '登录',
    register: '注册',
    logout: '退出登录',
    userCenter: '用户中心'
  },

  // 首页
  homePage: {
    title: '找到您理想的域名',
    subtitle: '探索、发现并获取适合您的下一个大创意的理想域名',
    uniqueValue: '独特价值',
    uniqueValueDescription: '每个域名都是独一无二的数字资产',
    security: '安全保障',
    securityDescription: '规范的交易流程，确保您的投资安全',
    potential: '增值潜力',
    potentialDescription: '优质域名具备巨大的升值空间',
    featuredDomains: '精选域名',
    viewAllDomains: '查看所有域名',
    getStarted: '开始使用',
    learnMore: '了解更多'
  },

  // 市场页面
  marketplace: {
    title: '域名市场',
    subtitle: '浏览并购买优质域名',
    searchPlaceholder: '搜索域名...',
    loadError: '加载域名失败',
    noDomainsFound: '未找到域名',
    resultsFound: '找到 {{count}} 个结果',
    sortBy: '排序方式',
    filters: {
      all: '全部',
      category: '分类',
      priceRange: '价格范围',
      verifiedOnly: '仅显示已验证',
      premium: '优质',
      short: '短域名',
      dev: '开发',
      business: '商业',
      tech: '科技',
      finance: '金融',
      education: '教育',
      health: '健康',
      entertainment: '娱乐'
    },
    sort: {
      newest: '最新上架',
      oldest: '最早上架',
      priceHigh: '价格从高到低',
      priceLow: '价格从低到高',
      nameAZ: '名称A-Z',
      nameZA: '名称Z-A'
    }
  },

  // 域名相关
  domains: {
    name: '域名',
    price: '价格',
    owner: '所有者',
    category: '分类',
    domainStatus: '状态',
    domainVerification: '验证状态',
    domainStats: '统计',
    created: '创建时间',
    updated: '更新时间',
    loadError: '加载域名失败',
    addDomain: '添加域名',
    myDomains: '我的域名',
    refreshing: '刷新中...',
    viewDetails: '查看详情',
    makeOffer: '出价',
    buyNow: '立即购买',
    contactSeller: '联系卖家',
    addToFavorites: '添加收藏',
    shareLink: '分享链接',
    reportDomain: '举报域名',
    categories: {
      business: '商业',
      tech: '科技',
      finance: '金融',
      education: '教育',
      health: '健康',
      entertainment: '娱乐',
      standard: '标准',
      premium: '优质',
      short: '短域名',
      brandable: '品牌域名'
    },
    statusTypes: {
      available: '可售',
      sold: '已售',
      reserved: '保留',
      pending: '待处理',
      draft: '草稿',
      active: '活跃',
      inactive: '未激活'
    },
    verificationTypes: {
      verified: '已验证',
      pending: '待验证',
      none: '未验证',
      rejected: '验证失败'
    },
    statistics: {
      views: '浏览量',
      favorites: '收藏数',
      offers: '报价数',
      inquiries: '咨询数'
    }
  },

  // 管理员面板
  admin: {
    title: '管理员控制面板',
    accessDenied: '您没有管理员权限',
    accessDeniedTitle: '访问被拒绝',
    accessDeniedMessage: '您没有权限访问此页面',
    verifyingPermissions: '验证管理员权限...',
    tabs: {
      dashboard: '仪表盘',
      verifications: '待验证域名',
      domains: '所有域名',
      users: '用户管理',
      settings: '网站设置',
      analytics: '数据分析',
      reports: '报告中心'
    },
    adminStats: {
      loadError: '加载管理统计信息失败',
      totalDomains: '域名总数',
      pendingVerifications: '待验证数',
      totalUsers: '用户总数',
      monthlyRevenue: '月收入'
    },
    domainsSection: {
      allListings: '所有域名列表',
      loadError: '加载域名失败',
      searchPlaceholder: '搜索域名...',
      filterByStatus: '按状态筛选',
      filterByVerification: '按验证状态筛选',
      noDomains: '未找到域名',
      updateError: '更新域名失败',
      statusUpdated: '域名状态已更新为 {{status}}',
      statusUpdateError: '更新域名状态失败',
      removedHighlight: '域名已从精选列表移除',
      addedHighlight: '域名已添加到精选列表',
      removeFeatured: '移除精选',
      markAsFeatured: '标记为精选',
      setAvailable: '设为可售',
      markAsSold: '标记为已售',
      markAsReserved: '标记为保留'
    },
    verificationsSection: {
      loadError: '加载待验证列表失败',
      approveSuccess: '域名验证已通过',
      approveError: '批准验证失败',
      rejectSuccess: '域名验证已拒绝',
      rejectError: '拒绝验证失败'
    },
    verifications: {
      title: '待验证域名',
      noPending: '没有待验证的域名',
      approve: '批准',
      reject: '拒绝',
      viewDetails: '查看详情'
    }
  },

  // 验证相关
  verification: {
    title: '域名验证',
    methods: {
      dns: 'DNS验证',
      html: 'HTML文件验证',
      email: '邮箱验证'
    },
    status: {
      pending: '验证中',
      verified: '已验证',
      failed: '验证失败'
    },
    instructions: '请按照以下步骤完成域名验证'
  },

  // 通知
  notifications: {
    title: '通知',
    markAllRead: '全部标记为已读',
    noNotifications: '暂无通知',
    verificationApproved: {
      title: '域名验证已通过',
      message: '您的域名 {{domain}} 已通过验证，现在可以上架销售。'
    },
    verificationRejected: {
      title: '域名验证被拒绝',
      message: '您的域名 {{domain}} 验证请求被拒绝，请检查域名所有权或联系平台管理员。'
    }
  },

  // 用户中心
  userCenter: {
    title: '用户中心',
    welcome: '欢迎回来',
    myDomains: '我的域名',
    transactions: '交易记录',
    profile: '个人资料',
    settings: '设置',
    notifications: '通知',
    favorites: '我的收藏',
    offers: '我的报价',
    dashboard: '仪表盘'
  },

  // 表单和输入
  forms: {
    required: '此字段为必填项',
    invalid: '输入格式不正确',
    tooShort: '输入内容过短',
    tooLong: '输入内容过长',
    passwordMismatch: '密码不匹配',
    emailInvalid: '邮箱格式不正确',
    domainInvalid: '域名格式不正确',
    priceInvalid: '价格格式不正确'
  },

  // 错误和成功消息
  messages: {
    success: {
      saved: '保存成功',
      updated: '更新成功',
      deleted: '删除成功',
      sent: '发送成功',
      uploaded: '上传成功'
    },
    error: {
      general: '操作失败，请重试',
      network: '网络连接错误',
      unauthorized: '未授权访问',
      notFound: '未找到相关内容',
      serverError: '服务器错误'
    }
  }
};
