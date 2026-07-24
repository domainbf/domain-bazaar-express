
export const en = {
  common: {
    all: 'All', refresh: 'Refresh', actions: 'Actions', unknown: 'Unknown', search: 'Search',
    filter: 'Filter', save: 'Save', cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete',
    edit: 'Edit', add: 'Add', close: 'Close', loading: 'Loading...', error: 'Error',
    success: 'Success', warning: 'Warning', info: 'Info', yes: 'Yes', no: 'No',
    next: 'Next', previous: 'Previous', submit: 'Submit', reset: 'Reset', back: 'Back',
    continue: 'Continue', finish: 'Finish', backToHome: 'Back to Home',
    changingLanguage: 'Changing language...', languageChangeFailed: 'Failed to change language',
    languageChanged: 'Language changed successfully', more: 'More', less: 'Less', view: 'View',
    contact: 'Contact', email: 'Email', phone: 'Phone', name: 'Name',
    description: 'Description', status: 'Status', type: 'Type', date: 'Date', time: 'Time',
    viewAll: 'View All', copySuccess: 'Copied to clipboard', copyFailed: 'Copy failed',
    starting: 'Starting', platformDescription: 'Domain trading & valuation platform',
    retry: 'Retry', export: 'Export', import: 'Import', upload: 'Upload', download: 'Download',
    approve: 'Approve', reject: 'Reject', pending: 'Pending', processing: 'Processing',
    completed: 'Completed', failed: 'Failed', expired: 'Expired', total: 'Total',
    currency: 'Currency', amount: 'Amount', notes: 'Notes', operation: 'Action', detail: 'Details',
    yesConfirm: 'Confirm', noThanks: 'Not now',
  },

  auth: {
    welcome: 'Welcome to Domainly',
    login: 'Log in', register: 'Sign up', logout: 'Log out',
    email: 'Email', password: 'Password', confirmPassword: 'Confirm password',
    forgotPassword: 'Forgot password?', rememberMe: 'Remember me',
    loginTitle: 'Sign in to your account', registerTitle: 'Create an account',
    loginSubmit: 'Sign in', registerSubmit: 'Sign up',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
    orContinueWith: 'Or continue with',
    loginSuccess: 'Signed in successfully', registerSuccess: 'Account created',
    loginFailed: 'Sign in failed', registerFailed: 'Sign up failed',
    emailRequired: 'Email is required', passwordRequired: 'Password is required',
    passwordTooShort: 'Password must be at least 6 characters', passwordMismatch: 'Passwords do not match',
    resetPassword: 'Reset password', sendResetLink: 'Send reset link',
    resetEmailSent: 'Password reset email sent',
    verifyEmail: 'Please verify your email', verifyEmailSent: 'Verification email sent',
  },

  nav: {
    home: 'Home', marketplace: 'Marketplace', dashboard: 'Dashboard', profile: 'Profile',
    admin: 'Admin', login: 'Log in', register: 'Sign up', logout: 'Log out',
    userCenter: 'Account', favorites: 'Favorites', offers: 'My Offers',
    notifications: 'Notifications', messages: 'Messages', valuation: 'Valuation',
    auctions: 'Auctions', sell: 'Sell Domain', help: 'Help',
  },

  footer: {
    marketplace: 'Marketplace', services: 'Services', support: 'Support', legal: 'Legal',
    links: {
      marketplace: 'Domain Marketplace', valuation: 'Valuation', monitor: 'Domain Monitor',
      auctions: 'Auctions', platformServices: 'Platform Services',
      escrow: 'Escrow', seller: 'Become a Seller', bulkListing: 'Bulk Listing',
      dispute: 'Dispute Center', help: 'Help & Support',
      faq: 'FAQ', contact: 'Contact', community: 'Community', security: 'Security Center',
      terms: 'Terms of Service', privacy: 'Privacy Policy', disclaimer: 'Disclaimer',
    },
    stats: { listings: 'Listings', users: 'Users', deals: 'Deals Closed', rating: 'Avg. Rating' },
    tagline: 'A professional domain marketplace with escrow, brokerage and dispute mediation.',
    copyrightSuffix: 'All rights reserved',
    slogan: 'Secure · Trusted · Efficient',
    escrowNote: 'Transactions protected by escrow',
    socialTitles: { email: 'Email us', github: 'GitHub', twitter: 'Twitter / X', weibo: 'Weibo', phone: 'Phone' },
  },

  homePage: {
    title: 'Find your perfect domain',
    subtitle: 'Discover and acquire the perfect domain for your next big idea',
    browseDomains: 'Browse Marketplace', sellDomains: 'Sell Your Domain',
    userDashboard: 'Your Domain Console', activeDomains: 'Active Domains', manageDomains: 'Manage',
    unreadMessages: 'Unread Messages', viewNotifications: 'View Notifications',
    defaultUser: 'User', basicUser: 'Basic User',
    editProfile: 'Edit Profile', fullDashboard: 'Open Full Dashboard',
    featuredDomains: 'Featured Domains', tryAdjustingFilters: 'Try adjusting filters or add your own domain',
    addYourDomain: 'Add Your Domain',
    howItWorks: 'How it works',
    step1Title: 'Create an account', step1Description: 'Sign up free to buy or sell domains',
    step2Title: 'List or browse', step2Description: 'List your domain or browse the market',
    step3Title: 'Close the deal', step3Description: 'Complete your transaction securely',
    platformStats: 'Platform Stats', activeUsers: 'Active Users', countries: 'Countries',
    transactionVolume: 'Transaction Volume', customerSupport: 'Support',
    ctaTitle: 'Ready to buy or sell a domain?',
    ctaDescription: 'Join our platform today and start trading with confidence',
    visitUserCenter: 'Go to Account', registerLogin: 'Sign up / Log in',
    footer: '© ' + new Date().getFullYear() + ' Domainly. All rights reserved.',
    hotDomains: 'Hot Domains', latestAuctions: 'Latest Auctions', soldShowcase: 'Recently Sold',
    searchPlaceholder: 'Search domains or keywords...',
  },

  marketplace: {
    title: 'Marketplace', subtitle: 'Browse and buy premium domains',
    searchPlaceholder: 'Search domains...', loadError: 'Failed to load domains',
    noDomainsFound: 'No domains found', resultsFound: '{{count}} results',
    sortBy: 'Sort', sort: {
      newest: 'Newest', priceAsc: 'Price ↑', priceDesc: 'Price ↓',
      lengthAsc: 'Length ↑', popular: 'Popular', alpha: 'A–Z',
    },
    favoriteOnly: 'Favorites only', loadMore: 'Load more',
    filters: {
      all: 'All', premium: 'Premium', short: 'Short', business: 'Business',
      tech: 'Tech', dev: 'Dev', finance: 'Finance', education: 'Education',
      health: 'Health', entertainment: 'Entertainment', verifiedOnly: 'Verified only'
    },
    price: {
      minLabel: 'Min price ($)', maxLabel: 'Max price ($)',
      minPlaceholder: 'Min', maxPlaceholder: 'Max', reset: 'Reset'
    }
  },

  domains: {
    name: 'Domain', price: 'Price', owner: 'Owner', category: 'Category',
    domainStatus: 'Status', domainVerification: 'Verification', domainStats: 'Stats',
    created: 'Created', updated: 'Updated',
    length: 'Length', suffix: 'TLD', views: 'Views',
    categories: {
      business: 'Business', tech: 'Tech', finance: 'Finance', education: 'Education',
      health: 'Health', entertainment: 'Entertainment', standard: 'Standard',
      premium: 'Premium', short: 'Short', brandable: 'Brandable'
    },
    detail: {
      makeOffer: 'Make an Offer', buyNow: 'Buy Now', favorite: 'Favorite',
      unfavorite: 'Unfavorite', share: 'Share', copy: 'Copy',
      contactSeller: 'Contact Seller', whois: 'WHOIS', aiValuation: 'AI Valuation',
      offerHistory: 'Offer History', similarDomains: 'Similar Domains',
      status: { available: 'Available', sold: 'Sold', reserved: 'Reserved', pending: 'Pending' },
    },
  },

  offer: {
    title: 'Make an Offer', amount: 'Offer amount', currency: 'Currency',
    message: 'Message (optional)', contactEmail: 'Email', contactPhone: 'Phone',
    submit: 'Submit Offer', submitting: 'Submitting...',
    minAmount: 'Minimum offer {{min}}', maxAmount: 'Maximum offer {{max}}',
    priceInvalid: 'Please enter a valid amount',
    preview: 'Preview', pricePreview: 'Approx. {{value}}',
    success: 'Offer submitted, awaiting seller response',
    failed: 'Failed to submit offer', duplicate: 'Duplicate submission blocked',
    status: { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', countered: 'Countered', withdrawn: 'Withdrawn' },
    withdraw: 'Withdraw', resend: 'Resend',
  },

  admin: {
    title: 'Admin Console', accessDenied: 'You do not have admin permissions',
    accessDeniedTitle: 'Access Denied', accessDeniedMessage: 'You do not have permission to access this page',
    verifyingPermissions: 'Verifying admin permissions...',
    nav: {
      dashboard: 'Overview', users: 'Users', domains: 'Domains', orders: 'Orders',
      offers: 'Offers', withdrawals: 'Withdrawals', disputes: 'Disputes',
      audit: 'Audit Log', logos: 'Logos', settings: 'Site Settings',
      telemetry: 'Telemetry', kyc: 'KYC Review', payments: 'Payments',
      tickets: 'Tickets', content: 'Content',
    },
    orders: {
      title: 'Order Management', advance: 'Advance Stage', resendReceipt: 'Resend Receipt',
      exportPdf: 'Export PDF', markPaid: 'Mark as Paid', markTransferred: 'Mark Transferred',
    },
    withdrawals: {
      title: 'Withdrawal Reviews', approve: 'Approve', reject: 'Reject', markPaid: 'Mark Paid',
      pendingCount: '{{count}} pending',
    },
    disputes: {
      title: 'Disputes', ruling: 'Ruling', rulingBuyer: 'Rule for Buyer',
      rulingSeller: 'Rule for Seller', closeDispute: 'Close Dispute',
    },
    audit: {
      title: 'Audit Log', dateFrom: 'From', dateTo: 'To',
      exportCsv: 'Export CSV', userFilter: 'Filter by user',
    },
    settings: {
      title: 'Site Settings', general: 'General', branding: 'Branding', social: 'Social',
      seo: 'SEO', legal: 'Legal', save: 'Save', saved: 'Settings saved',
    },
    logos: {
      title: 'Logo Management', regenerate: 'Regenerate', viewLogs: 'View Logs',
      styleClassic: 'Classic', styleMinimal: 'Minimal',
    },
  },

  verification: {
    title: 'Domain Verification',
    methods: { dns: 'DNS Verification', html: 'HTML File Verification', email: 'Email Verification' },
    status: {
      pending: 'Pending', verified: 'Verified Domain', failed: 'Failed',
      verifiedDescription: 'This domain has been successfully verified and is marked as trusted in our marketplace.',
      pendingDescription: 'Please complete the following verification steps to prove ownership.',
      unverified: 'Unverified Domain',
      unverifiedDescription: 'Verified domains gain more visibility and trust in our marketplace.',
    },
    success: {
      title: 'Domain Verified', description: 'Your domain has been successfully verified',
      message: 'Your domain {{domainName}} is now verified and gets these benefits:',
      benefits: {
        visibility: 'Higher visibility in marketplace search',
        badge: 'Verified badge shown to potential buyers',
        trust: 'Increased trust and credibility',
        support: 'Priority support access',
      },
      returnToDashboard: 'Back to Dashboard',
    },
  },

  notifications: {
    title: 'Notifications', markAllRead: 'Mark all as read', noNotifications: 'No notifications',
    settings: 'Notification Settings', channels: { email: 'Email', inApp: 'In-app' },
    types: {
      offer: 'Offers', order: 'Orders', dispute: 'Disputes',
      kyc: 'KYC', system: 'System',
    },
  },

  userCenter: {
    title: 'Account', welcome: 'Welcome back',
    myDomains: 'My Domains', transactions: 'Transactions',
    profile: 'Profile', settings: 'Settings', notifications: 'Notifications',
    favorites: 'Favorites', offers: 'My Offers', dashboard: 'Dashboard',
    wallet: 'Wallet', kyc: 'KYC', security: 'Security', messages: 'Messages',
    wallet_: {
      balance: 'Balance', withdraw: 'Withdraw', recharge: 'Top Up',
      records: 'Transactions', withdrawAmount: 'Withdraw amount',
      bankAccount: 'Payout account', submitWithdraw: 'Submit',
      pending: 'Pending', paid: 'Paid',
    },
    kyc_: {
      title: 'Identity Verification', realName: 'Legal name', idNumber: 'ID number',
      idType: 'ID type', idFront: 'ID front', idBack: 'ID back',
      selfie: 'Selfie with ID', submit: 'Submit', status: 'Status',
      approved: 'Approved', rejected: 'Rejected', pending: 'Pending',
    },
    favorites_: { empty: 'No favorites yet', remove: 'Remove' },
    offers_: { received: 'Received', sent: 'Sent', empty: 'No offers' },
  },

  forms: {
    required: 'This field is required', invalid: 'Invalid format',
    tooShort: 'Input too short', tooLong: 'Input too long',
    passwordMismatch: 'Passwords do not match', emailInvalid: 'Invalid email',
    domainInvalid: 'Invalid domain', priceInvalid: 'Invalid price',
  },

  messages: {
    success: { saved: 'Saved', updated: 'Updated', deleted: 'Deleted', sent: 'Sent', uploaded: 'Uploaded' },
    error: { general: 'Operation failed, please retry', network: 'Network error', unauthorized: 'Unauthorized', notFound: 'Not found', serverError: 'Server error' }
  },

  soldDomains: {
    title: 'Recent Sales', soldFor: 'Sold for', subtitle: 'These domains were successfully sold'
  },
};
