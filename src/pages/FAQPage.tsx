import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail,
  Globe,
  Shield,
  CreditCard,
  Users,
  Gavel,
  Tag,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const CATEGORIES = [
  { id: 'all',          label: '全部',      icon: Globe },
  { id: 'general',      label: '平台介绍',  icon: Users },
  { id: 'transaction',  label: '交易流程',  icon: CreditCard },
  { id: 'verification', label: '域名验证',  icon: Shield },
  { id: 'auction',      label: '域名竞拍',  icon: Gavel },
  { id: 'pricing',      label: '费用说明',  icon: Tag },
  { id: 'account',      label: '账户安全',  icon: Lock },
  { id: 'dispute',      label: '纠纷处理',  icon: AlertCircle },
];

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '什么是域见·你（NIC.RW）域名交易平台？',
    answer: '域见·你（NIC.RW）是专注于优质域名买卖的专业撮合平台。平台提供域名挂牌、域名竞拍、资金第三方托管、所有权验证、专属客服等一站式服务，旨在为买卖双方打造安全、透明、高效的域名交易生态。\n\n我们参照 Sedo、Afternic、Dan.com 等国际知名平台的行业标准，建立完善的交易规则和纠纷调解机制，确保每一笔交易有据可查、全程受保障。',
    category: 'general',
    tags: ['平台介绍', '域名交易', '关于我们']
  },
  {
    id: '2',
    question: '平台适合哪些用户？',
    answer: '平台面向以下三类用户：\n\n• 域名投资者（Domainer）：持有大量域名资产，需要一个高曝光率的市场出售变现；\n• 创业者/企业：希望采购与品牌匹配的优质域名，快速建立数字资产；\n• 个人用户：偶尔出售闲置域名，或寻找心仪域名作为个人站点。\n\n无论是单个域名还是批量操作，我们都提供相应的工具和服务支持。',
    category: 'general',
    tags: ['用户类型', '适用场景']
  },
  {
    id: '3',
    question: '如何注册账号？',
    answer: '注册步骤如下：\n\n1. 点击首页右上角"注册"按钮；\n2. 填写邮箱地址并设置密码（密码须包含大小写字母和数字，至少 8 位）；\n3. 系统发送验证邮件，点击邮件中的链接完成邮箱验证；\n4. 完善个人资料（用户名、头像等），即可开始使用。\n\n也可使用 Google 账号一键登录，无需额外注册。同一邮箱只能注册一个账户，禁止一人多号。',
    category: 'account',
    tags: ['注册', '账户创建']
  },
  {
    id: '4',
    question: '如何在平台出售我的域名？',
    answer: '出售流程分为四步：\n\n① 添加域名：进入"用户中心" → "我的域名" → 点击"添加域名"，填写域名名称、分类、描述及挂牌价格；\n\n② 验证所有权：系统提供三种验证方式——DNS TXT 记录验证（推荐）、HTML 文件上传验证、注册邮箱验证。验证通过后域名显示"已验证"标识，大幅提升买家信任；\n\n③ 发布上架：完成验证后点击"发布"，域名将出现在市场列表中；\n\n④ 接单处理：收到买家报价后，可在用户中心选择"接受"或"反报价"，同意后进入托管付款流程。',
    category: 'transaction',
    tags: ['出售域名', '上架流程', '卖家']
  },
  {
    id: '5',
    question: '如何购买域名？',
    answer: '购买流程：\n\n① 浏览/搜索：在"域名市场"页面按后缀、价格、分类筛选，或直接搜索目标域名；\n\n② 查看详情：点击域名卡片查看描述、价格历史、所有权验证状态及卖家评分；\n\n③ 发起交易：\n  - 一口价购买：点击"立即购买"，填写联系信息后进入付款；\n  - 议价报价：点击"提交报价"，输入您的出价，等待卖家回应；\n\n④ 完成转移：付款确认后，卖家在约定时间内提供域名转移授权码（EPP Code），平台协助完成过户；\n\n⑤ 确认收域：确认域名已转入您的账户后，资金从托管账户划付给卖家，交易完成。',
    category: 'transaction',
    tags: ['购买域名', '交易流程', '买家']
  },
  {
    id: '6',
    question: '什么是资金托管？为什么要用托管？',
    answer: '资金托管（Escrow）是指买家先将购买款项支付至平台指定的第三方账户，待域名成功转移到买家名下并确认无误后，平台再将款项划付给卖家。\n\n使用托管的好处：\n• 买家保障：付款后若卖家无法完成域名转移，款项全额退回；\n• 卖家保障：确认域名已转移后才放款，杜绝买家骗取域名后拒付；\n• 纠纷有据：平台留存全程交易记录，作为调解依据。\n\n强烈建议所有交易通过平台托管完成，切勿绕过平台私下转账，以免遭受损失。',
    category: 'transaction',
    tags: ['资金托管', '交易安全', 'Escrow']
  },
  {
    id: '7',
    question: '平台收取哪些费用？',
    answer: '费用说明如下：\n\n• 挂牌费：免费，域名上架不收费；\n• 买家费用：无需支付任何手续费；\n• 卖家服务费：成交后收取成交金额的 5%（税后）。例如域名售价 ¥10,000，卖家实收 ¥9,500；\n• 竞拍保证金：参与拍卖须缴纳一定比例保证金，竞拍失败后全额退还；\n• 提现费用：根据提现渠道可能产生银行手续费，平台不额外收取。\n\n平台不收取月费、年费或任何隐藏费用。费率如有调整将提前 30 天公告通知。',
    category: 'pricing',
    tags: ['费用', '手续费', '服务费', '收费标准']
  },
  {
    id: '8',
    question: '域名验证有哪些方式？各有什么要求？',
    answer: '平台支持三种验证方式：\n\n① DNS TXT 记录验证（推荐）\n在域名 DNS 管理后台添加一条 TXT 记录，内容为平台分配的验证码。生效时间通常 10 分钟 ~ 24 小时（视 DNS 服务商 TTL 而定）。验证后该域名显示"已验证"蓝色标志。\n\n② HTML 文件验证\n将平台提供的 HTML 验证文件上传至域名网站根目录（例：example.com/nicverify.html），平台抓取该文件内容完成验证。网站需能正常访问。\n\n③ 注册邮箱验证\n平台向域名 WHOIS 中登记的注册邮箱发送验证码，输入验证码即可完成。要求 WHOIS 邮箱信息未被隐藏（Privacy Protection 需临时关闭）。\n\n三种方式均有效，选择最适合您的操作方式即可。',
    category: 'verification',
    tags: ['域名验证', 'DNS验证', 'WHOIS', '所有权证明']
  },
  {
    id: '9',
    question: '域名验证失败怎么办？',
    answer: '常见原因及解决方法：\n\n• DNS TXT 验证失败：检查 TXT 记录内容是否完全一致（注意大小写）；确认 DNS 已生效（可用 dnschecker.org 查询全球传播情况）；部分 DNS 服务商需 24 小时才能全球同步，请耐心等待后重试。\n\n• HTML 文件验证失败：确认文件路径正确（网站根目录）；检查服务器是否屏蔽了平台爬虫 IP；确认文件内容与平台提供的内容完全一致，不要添加额外空格或换行。\n\n• 邮箱验证失败：确认 WHOIS 邮箱已关闭隐私保护；检查垃圾邮件文件夹；验证码有效期为 30 分钟，超时需重新发送。\n\n如仍无法解决，请通过"联系我们"提交工单，客服将在 24 小时内协助处理。',
    category: 'verification',
    tags: ['验证失败', '故障排查', 'DNS']
  },
  {
    id: '10',
    question: '域名竞拍是如何运作的？',
    answer: '域名竞拍流程：\n\n① 浏览拍卖：进入"域名竞拍"页面，查看正在进行和即将开始的拍卖；\n\n② 缴纳保证金：参与竞拍前需预存保证金（通常为起拍价的 10%），保证金在竞拍结束后 24 小时内退还给未得标者；\n\n③ 出价规则：每次出价须高于当前最高价，系统支持"自动出价"（设定最高接受价，系统自动以最小加价幅度追价）；\n\n④ 延时规则：若最后 5 分钟内出现新报价，倒计时自动延长 5 分钟，防止恶意狙击；\n\n⑤ 成交结算：拍卖结束后，最高出价者在 48 小时内完成付款，进入标准托管流程；超时未付则视为放弃，保证金不予退还，并通知次高出价者。',
    category: 'auction',
    tags: ['域名竞拍', '拍卖', '出价', '保证金']
  },
  {
    id: '11',
    question: '竞拍保证金什么时候退还？',
    answer: '• 竞拍失败者：拍卖结束后，系统在 24 小时内自动退还至您的平台余额，您可随时提现；\n• 竞拍成功者：保证金转为购买款项的一部分，补足差额后完成交易；\n• 主动撤标：在拍卖未结束时主动放弃出价，保证金不予退还，且可能受到账号限制；\n• 成功后违约（未付款）：保证金没收，不予退还，平台有权暂停您的账户。\n\n建议只在确认有购买意向后再参与竞拍。',
    category: 'auction',
    tags: ['保证金', '退款', '竞拍规则']
  },
  {
    id: '12',
    question: '报价被拒绝后还能再次报价吗？',
    answer: '可以。卖家拒绝后您可随时发起新的报价。\n\n建议策略：\n• 查看卖家设定的"最低可接受价格"（如卖家公开了此信息）；\n• 在备注中简要说明您的用途和诚意，有助于卖家接受；\n• 与卖家通过站内消息沟通，了解其期望价格区间；\n• 合理议价，通常成交价在挂牌价的 70%~90% 之间；\n• 避免频繁低价扰单，否则可能被卖家拉黑或被平台判定恶意报价。',
    category: 'transaction',
    tags: ['报价', '议价', '还价']
  },
  {
    id: '13',
    question: '域名转移需要多长时间？',
    answer: '域名转移时间视注册商和后缀而定：\n\n• .com/.net/.org：通常 5~7 个工作日，部分注册商提供加急转移（1~2 天）；\n• .cn/.中国 等国内后缀：需通过 CNNIC 流程，一般 3~5 个工作日；\n• 国家代码域名（.rw/.ke/.af 等）：视各国注册局政策，3~14 个工作日不等；\n\n转移流程：\n1. 交易确认后，卖家在 48 小时内提供 EPP 转移授权码（Auth Code）；\n2. 买家在其注册商处发起转入申请，输入授权码；\n3. 卖家域名注册商收到转移申请后，通常有 5 天时间拒绝（默认不操作即视为同意）；\n4. 转移完成后买家确认，资金放款给卖家。\n\n全程平台客服跟进，遇到阻塞情况可随时联系我们介入协助。',
    category: 'transaction',
    tags: ['域名转移', '转移时间', 'EPP', '授权码']
  },
  {
    id: '14',
    question: '卖家迟迟不提供转移授权码怎么办？',
    answer: '交易确认后，卖家须在 48 小时内提供授权码。如超时：\n\n1. 通过站内消息催促卖家；\n2. 若 72 小时内仍无响应，可在"用户中心" → "交易记录"中提交申诉；\n3. 平台客服介入，向卖家发出正式通知，要求在 24 小时内处理；\n4. 如卖家仍不配合，平台判定卖家违约，买家全额退款，卖家账户受到处罚（降级/封号）。\n\n建议在交易前查看卖家评分和历史成交记录，优先选择信誉良好的卖家。',
    category: 'dispute',
    tags: ['转移纠纷', '卖家违约', '申诉']
  },
  {
    id: '15',
    question: '如何确保交易安全，避免被骗？',
    answer: '交易安全六项准则：\n\n① 始终使用平台托管：绝不接受卖家要求微信/支付宝私下打款；\n② 确认域名已验证：优先选择带"已验证"标志的域名，降低虚假信息风险；\n③ 核实 WHOIS 信息：自行查询 WHOIS 数据，确认卖家为真实所有者；\n④ 了解域名历史：检查域名是否曾有商标纠纷、被搜索引擎惩罚等历史；\n⑤ 警惕超低价诱导：市场价远低于正常水平的域名可能存在权属纠纷；\n⑥ 保留聊天记录：通过平台站内消息沟通，所有记录可作为证据。\n\n如遇可疑情况，第一时间举报给平台客服，我们 24 小时受理投诉。',
    category: 'transaction',
    tags: ['交易安全', '防骗', '安全提示']
  },
  {
    id: '16',
    question: '买家付款后域名还没到账怎么处理？',
    answer: '买家付款后域名应在约定时间内完成转移。如超时未到账：\n\n1. 检查是否已在注册商处确认转入申请（部分注册商需买家主动确认）；\n2. 联系卖家确认是否已提交转移申请及授权码是否正确；\n3. 查看域名 WHOIS 状态，确认是否显示"Pending Transfer"；\n4. 若以上步骤无法解决，请在平台提交"转移纠纷"申诉；\n5. 平台调解无效时，可申请退款并报告卖家违约。\n\n平台全程保管资金，买家的款项在交易完成确认前不会到达卖家账户，您的资金安全有保障。',
    category: 'dispute',
    tags: ['域名未到账', '转移延误', '退款']
  },
  {
    id: '17',
    question: '如何申请退款？',
    answer: '退款适用情形：\n\n• 交易取消（双方协商一致）：买卖双方确认取消后，款项 3~5 个工作日退回原支付渠道；\n• 卖家违约（无法完成转移）：经平台核实后，全额退款，通常 5~7 个工作日处理；\n• 商品描述不符（域名存在重大隐患）：需提交证明材料，平台审核后决定退款方案；\n• 平台服务故障导致交易失败：全额退款。\n\n不支持退款的情形：\n• 域名已成功转移到买家名下；\n• 买家单方面反悔（不属于平台或卖家过错）；\n• 竞拍成功后无故放弃（保证金不退）。\n\n申请入口：用户中心 → 交易记录 → 对应订单 → 申请退款。',
    category: 'transaction',
    tags: ['退款', '取消交易', '维权']
  },
  {
    id: '18',
    question: '如何提交交易纠纷申诉？',
    answer: '申诉流程：\n\n1. 进入"用户中心" → "纠纷申诉"，点击"发起申诉"；\n2. 选择对应的交易订单，说明纠纷原因（卖家违约 / 描述不符 / 拒绝付款等）；\n3. 上传相关证据（截图、邮件记录、WHOIS 信息等），证据越详尽越有助于快速解决；\n4. 平台客服在 24 小时内受理并通知对方当事人；\n5. 双方均可提交各自的陈述和证据；\n6. 平台在 5~10 个工作日内作出调解决定，若双方接受则执行；\n7. 如调解不满意，可向当地消费者保护机构投诉或通过法律途径解决。\n\n平台承诺中立、公平处理每一起纠纷，禁止偏袒任何一方。',
    category: 'dispute',
    tags: ['申诉', '纠纷处理', '仲裁']
  },
  {
    id: '19',
    question: '如何可以修改已发布的域名信息？',
    answer: '您可以随时编辑域名的以下信息：\n\n• 挂牌价格（允许随时调整）；\n• 域名描述、分类标签；\n• 是否接受议价（可设置"固定价格"或"接受报价"）；\n• 最低可接受报价（对买家不可见，仅作内部筛选）。\n\n操作路径：用户中心 → 我的域名 → 点击编辑图标。\n\n注意：如该域名已有"待处理"的报价或正在进行交易流程，价格修改将在当前进行中的报价处理完成后才生效。已进入付款阶段的交易不可单方面修改价格。',
    category: 'general',
    tags: ['修改信息', '调价', '域名管理']
  },
  {
    id: '20',
    question: '如何下架/删除域名？',
    answer: '下架操作：用户中心 → 我的域名 → 点击域名右侧"…"菜单 → 选择"下架"。下架后域名不再显示在市场，但保留在您的账户中，可随时重新上架。\n\n删除操作：下架后可进一步选择"删除域名"，删除后数据不可恢复。\n\n注意：\n• 有未处理报价时无法直接下架，需先处理（接受/拒绝）所有待处理报价；\n• 正在进行托管交易的域名不可下架，需等交易完成或取消后操作；\n• 已经过验证的域名下架后重新上架无需再次验证。',
    category: 'general',
    tags: ['下架', '删除', '域名管理']
  },
  {
    id: '21',
    question: '支持哪些支付方式？',
    answer: '当前支持的支付方式：\n\n• 银行转账（对公/对私）；\n• 微信支付（限国内用户）；\n• 支付宝（限国内用户）；\n• 国际电汇（SWIFT，适用于跨境交易）；\n• 加密货币支付（USDT/USDC，联系客服开通）。\n\n所有支付均通过平台托管账户中转，资金安全有保障。具体支付方式以交易页面实时展示为准，不同订单金额及地区可能有所不同。\n\n如需发票，请在付款时备注，平台可开具普通增值税发票（发票类目：信息技术服务）。',
    category: 'pricing',
    tags: ['支付方式', '付款', '微信', '支付宝', '银行转账']
  },
  {
    id: '22',
    question: '平台资金如何提现？',
    answer: '提现步骤：\n\n1. 进入"用户中心" → "我的钱包"；\n2. 点击"申请提现"，选择提现渠道（银行卡/支付宝/微信）；\n3. 填写收款账户信息及金额；\n4. 提交后平台在 1~3 个工作日内审核；\n5. 审核通过后款项到达您的账户，部分渠道有到账延迟（银行转账通常 T+1~T+3）。\n\n注意：\n• 首次提现需完成实名认证；\n• 单笔提现最低金额为 ¥50；\n• 平台不收取提现手续费，但银行可能扣取转账费；\n• 如遇节假日，处理时间顺延到下一个工作日。',
    category: 'pricing',
    tags: ['提现', '钱包', '结算']
  },
  {
    id: '23',
    question: '忘记密码怎么办？',
    answer: '重置步骤：\n\n1. 点击登录页面的"忘记密码"链接；\n2. 输入注册时使用的邮箱地址；\n3. 查收重置邮件（注意检查垃圾邮件/促销邮件文件夹）；\n4. 点击邮件中的重置链接（链接有效期 30 分钟）；\n5. 设置新密码（须与旧密码不同，包含大小写字母和数字）。\n\n如果注册邮箱已无法访问，请通过"联系我们"提供账号相关证明，由客服协助核实后处理。\n\n安全建议：开启双因素认证（2FA），即使密码泄露也能保护账号安全。',
    category: 'account',
    tags: ['忘记密码', '密码重置', '账户安全']
  },
  {
    id: '24',
    question: '如何保护账号安全？',
    answer: '账号安全最佳实践：\n\n① 使用强密码：至少 12 位，混合大小写字母、数字和特殊符号，不要使用生日、手机号等易猜信息；\n② 不要重复使用密码：为本平台设置唯一密码，避免其他网站泄露影响到本账号；\n③ 警惕钓鱼邮件：平台不会通过邮件要求您点击链接输入密码，收到可疑邮件请立即举报；\n④ 妥善保管 API Key：如使用开发者接口，不要将 Key 泄露在公开代码仓库；\n⑤ 定期查看登录记录：在账户设置中查看最近登录设备和地点，发现异常立即修改密码；\n⑥ 绑定安全邮箱：确保注册邮箱始终可用，这是找回账号的唯一凭证。',
    category: 'account',
    tags: ['账户安全', '密码保护', '防盗号']
  },
  {
    id: '25',
    question: '如何设置域名最低接受报价？',
    answer: '最低接受价（Reserve Price）功能允许您设置一个对买家不可见的最低成交门槛：\n\n• 当买家报价低于此价格时，系统自动提示买家"价格过低"，卖家无需逐一手动拒绝；\n• 当报价达到或超过最低价时，系统通知卖家审核，提高成交效率；\n• 最低价可随时修改，不影响已发出的报价处理。\n\n设置路径：用户中心 → 我的域名 → 编辑域名 → 设置"最低接受报价"字段。\n\n注意：此功能与"一口价"不同，一口价是买家可直接购买的固定价格，最低接受价仅用于筛选报价。',
    category: 'general',
    tags: ['最低价', '报价设置', '卖家工具']
  },
  {
    id: '26',
    question: '如何批量上架域名？',
    answer: '平台提供批量上架功能，适合持有大量域名的投资者：\n\n1. 进入"用户中心" → "批量上架"；\n2. 下载 Excel/CSV 模板，按格式填写域名名称、类别、价格、描述等信息；\n3. 上传文件，系统自动解析并列出待上架域名清单；\n4. 确认无误后一键提交，域名批量入库；\n5. 验证环节：批量上架的域名同样需要完成所有权验证，可在上架后逐一完成验证。\n\n单次批量上架上限为 200 个域名。如有更大批量需求，请联系我们获取企业版方案。',
    category: 'general',
    tags: ['批量上架', '域名投资者', '效率工具']
  },
  {
    id: '27',
    question: '平台如何处理商标纠纷？',
    answer: '商标权人发起的域名争议处理流程：\n\n① 权利人举报：商标权人可向平台提交侵权举报，并提供商标注册证、域名侵权说明等材料；\n② 平台初审：我们在 3 个工作日内完成初步审核。若确实存在明显侵权，域名将暂时下架；\n③ 被举报方申诉：域名持有人有权在 7 天内提交抗辩材料；\n④ 综合裁定：平台参考 UDRP（统一域名争议解决政策）原则作出最终决定；\n⑤ 司法途径：如对平台裁定不满意，任何一方均可通过法律途径解决。\n\n平台承诺不参与任何域名抢注或恶意囤积行为。',
    category: 'dispute',
    tags: ['商标纠纷', 'UDRP', '知识产权', '侵权']
  },
  {
    id: '28',
    question: '域名价值评估结果准确吗？',
    answer: '平台提供的域名估值工具基于以下多维度数据综合计算：\n\n• 历史成交案例数据库（参考同类型、同后缀域名的实际成交价）；\n• 域名长度、可读性、记忆性等属性评分；\n• 搜索引擎相关关键词的商业价值；\n• 域名注册年龄和历史使用情况；\n• 当前市场供需趋势。\n\n重要说明：估值结果仅供参考，不代表最终市场价值。域名最终价格由市场供需和买卖双方协商决定。特别是具有品牌价值的短域名、知名词汇域名，实际成交价可能远超或低于算法估值。建议结合同类域名近期成交数据做综合判断。',
    category: 'general',
    tags: ['域名估值', '价格参考', '定价策略']
  },
  {
    id: '29',
    question: '卖家信誉评分是如何计算的？',
    answer: '卖家信誉评分（0~5 星）根据以下维度综合计算：\n\n• 历史成交笔数（交易越多权重越高）；\n• 买家成交后评价（描述是否符实、配合度、响应速度）；\n• 平均域名转移完成时间（越快分越高）；\n• 纠纷率（被申诉并判定违约会大幅扣分）；\n• 账户活跃度（长期不活跃的账户会降低部分评分权重）。\n\n新卖家无评分历史，系统会在其完成首次交易后开始积累评分。建议新卖家从中低价位域名开始，积累良好的早期评价。',
    category: 'general',
    tags: ['卖家评分', '信誉', '评价体系']
  },
  {
    id: '30',
    question: '买家可以对卖家进行评价吗？',
    answer: '可以。交易完成后，买家在 30 天内可对本次交易进行评价：\n\n• 综合评分（1~5 星）；\n• 分项评分：域名描述准确性、转移配合度、沟通响应速度；\n• 文字评论（选填，最多 500 字）。\n\n评价规则：\n• 评价提交后不可修改，请认真填写；\n• 不得发布虚假、恶意或与交易无关的评论；\n• 卖家有权对评价进行一次公开回复；\n• 平台有权删除违反社区规范的评价内容。\n\n诚信的评价体系让整个社区受益，感谢您的参与。',
    category: 'transaction',
    tags: ['评价', '信誉体系', '买家评分']
  },
  {
    id: '31',
    question: '平台是否提供域名中介（经纪）服务？',
    answer: '是的。如果您有意购买某个特定域名，但该域名尚未在平台挂牌，可申请我们的域名中介服务：\n\n① 提交目标域名及您的心理价位；\n② 平台专业团队联系该域名的当前持有人；\n③ 在买卖双方间协调谈判，达成价格共识；\n④ 通过平台标准托管流程完成交易。\n\n中介服务费：在标准服务费基础上，额外收取成交价的 3% 作为中介协调费，由买卖双方各承担 1.5%，或由协商方式确定。\n\n如感兴趣，请通过"联系我们"告知目标域名信息，我们会安排专人跟进。',
    category: 'general',
    tags: ['域名中介', '经纪服务', '定向收购']
  },
  {
    id: '32',
    question: '如何接收交易通知？',
    answer: '平台通过以下渠道发送通知：\n\n• 站内通知：所有重要事件（收到报价、交易确认、资金到账等）均在用户中心的"通知"栏显示；\n• 邮件通知：关键交易节点发送邮件至注册邮箱，建议不要屏蔽平台邮件；\n• 实时推送：浏览器页面保持打开时，重要通知会有弹出提示。\n\n通知设置：用户中心 → 账户设置 → 通知偏好，可自定义开关各类通知类型。\n\n建议开启至少邮件通知，防止因未及时查看站内通知而错过报价或交易窗口。',
    category: 'account',
    tags: ['通知设置', '交易提醒', '邮件']
  },
  {
    id: '33',
    question: '平台是否支持 API 接入？',
    answer: '我们提供 REST API，适用于以下场景：\n\n• 批量管理域名（上架、下架、修改价格）；\n• 将平台库存同步到自有网站展示；\n• 接收 Webhook 实时推送（新报价、交易状态变更等）；\n• 查询域名市场数据。\n\n申请方式：企业/开发者用户可在"账户设置" → "API 管理"中申请开发者权限，审核通过后获取 API Key。\n\n目前 API 功能处于邀请制内测阶段，如有需求请联系我们申请提前体验。API 文档将在正式开放后公布。',
    category: 'general',
    tags: ['API', '开发者', '接口', '自动化']
  },
  {
    id: '34',
    question: '如何注销账号？',
    answer: '注销账号将永久删除您的所有数据（域名信息、交易记录、余额等），此操作不可恢复，请谨慎操作。\n\n注销前须满足以下条件：\n• 账户余额为零（已完成全部提现）；\n• 无进行中的交易或待处理的报价；\n• 无未解决的纠纷申诉。\n\n操作路径：用户中心 → 账户设置 → 账户安全 → 注销账号 → 填写注销原因 → 邮箱验证确认。\n\n提交后系统将在 7 个工作日内完成注销，期间仍可撤回申请。注销完成后，该邮箱地址在 30 天内不可重新注册。',
    category: 'account',
    tags: ['注销账号', '账户删除', '数据删除']
  },
  {
    id: '35',
    question: '有哪些渠道可以联系客服？',
    answer: '我们提供多种客服渠道：\n\n• 在线工单：通过"联系我们"页面提交工单，工作日 24 小时内回复，节假日 48 小时内回复；\n• 客服邮箱：support@nic.rw，重大问题建议邮件联系，便于存档和追踪；\n• 平台反馈：页面右下角"反馈"按钮，适合快速反映页面 Bug 或功能建议；\n• 社区论坛：访问社区页面，与其他用户交流经验，平台人员也会在社区回复。\n\n服务时间：周一至周五 09:00–18:00（UTC+8），节假日可能有延迟。\n\n紧急交易问题（如资金安全、欺诈举报）请在工单中标注"紧急"，我们优先处理。',
    category: 'general',
    tags: ['客服', '联系方式', '支持']
  }
];

export const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-muted/50 pb-20 md:pb-0">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-4">常见问题</h1>
          <p className="text-xl text-muted-foreground">找到您需要的答案，或联系我们获取帮助</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="搜索问题、关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === cat.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background border-border hover:border-foreground/40'
              }`}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">共 {filteredFAQs.length} 条结果</p>

        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">未找到相关问题</p>
              <Link to="/contact">
                <Button variant="outline">联系客服</Button>
              </Link>
            </div>
          ) : filteredFAQs.map(faq => (
            <Card key={faq.id} className="transition-all hover:shadow-sm">
              <CardContent className="p-0">
                <button
                  className="w-full p-5 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpanded(faq.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-2">{faq.question}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {faq.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-0.5 shrink-0">
                      {expandedItems.has(faq.id) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>
                
                {expandedItems.has(faq.id) && (
                  <div className="px-5 pb-5 border-t bg-muted/20">
                    <div className="text-sm text-foreground leading-relaxed pt-4 whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-xl border bg-card text-center">
          <p className="font-medium mb-1">没有找到您的问题？</p>
          <p className="text-sm text-muted-foreground mb-4">我们的客服团队在工作日 24 小时内回复您的问题</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/contact">
              <Button className="gap-2"><Mail className="h-4 w-4" />联系客服</Button>
            </Link>
            <Link to="/community">
              <Button variant="outline" className="gap-2"><Users className="h-4 w-4" />社区讨论</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
