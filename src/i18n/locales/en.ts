
export const en = {
  // Common terms
  common: {
    all: 'All',
    refresh: 'Refresh',
    actions: 'Actions',
    unknown: 'Unknown',
    search: 'Search',
    filter: 'Filter',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    back: 'Back',
    continue: 'Continue',
    finish: 'Finish',
    backToHome: 'Back to Home',
    changingLanguage: 'Changing language...',
    languageChangeFailed: 'Failed to change language'
  },

  // Home page
  homePage: {
    title: 'Find Your Perfect Domain',
    subtitle: 'Explore, discover, and acquire the perfect domain name for your next big idea',
    uniqueValue: 'Unique Value',
    uniqueValueDescription: 'Every domain name is a unique digital asset',
    security: 'Security',
    securityDescription: 'Standardized transaction process ensures your investment security',
    potential: 'Growth Potential',
    potentialDescription: 'Premium domains have huge appreciation potential'
  },

  // Marketplace
  marketplace: {
    title: 'Domain Marketplace',
    subtitle: 'Browse and purchase premium domains',
    searchPlaceholder: 'Search domains...',
    loadError: 'Failed to load domains',
    noDomainsFound: 'No domains found',
    filters: {
      all: 'All',
      category: 'Category',
      priceRange: 'Price Range',
      verifiedOnly: 'Verified Only',
      premium: 'Premium',
      short: 'Short',
      dev: 'Development'
    }
  },

  // Domains
  domains: {
    name: 'Domain',
    price: 'Price',
    owner: 'Owner',
    category: 'Category',
    domainStatus: 'Status',
    domainVerification: 'Verification',
    domainStats: 'Stats',
    created: 'Created',
    loadError: 'Failed to load domains',
    addDomain: 'Add Domain',
    myDomains: 'My Domains',
    refreshing: 'Refreshing...',
    categories: {
      business: 'Business',
      tech: 'Technology',
      finance: 'Finance',
      education: 'Education',
      health: 'Health',
      entertainment: 'Entertainment',
      standard: 'Standard'
    },
    statusTypes: {
      available: 'Available',
      sold: 'Sold',
      reserved: 'Reserved',
      pending: 'Pending'
    },
    verificationTypes: {
      verified: 'Verified',
      pending: 'Pending',
      none: 'Not Verified'
    },
    statistics: {
      views: 'Views',
      favorites: 'Favorites',
      offers: 'Offers'
    }
  },

  // Admin panel
  admin: {
    title: 'Admin Control Panel',
    accessDenied: 'You do not have admin permissions',
    accessDeniedTitle: 'Access Denied',
    accessDeniedMessage: 'You do not have permission to access this page',
    verifyingPermissions: 'Verifying admin permissions...',
    tabs: {
      dashboard: 'Dashboard',
      verifications: 'Pending Verifications',
      domains: 'All Domains',
      users: 'User Management',
      settings: 'Site Settings'
    },
    adminStats: {
      loadError: 'Failed to load admin statistics'
    },
    domainsSection: {
      allListings: 'All Domain Listings',
      loadError: 'Failed to load domains',
      searchPlaceholder: 'Search domains...',
      filterByStatus: 'Filter by status',
      filterByVerification: 'Filter by verification',
      noDomains: 'No domains found',
      updateError: 'Failed to update domain',
      statusUpdated: 'Domain status updated to {{status}}',
      statusUpdateError: 'Failed to update domain status',
      removedHighlight: 'Domain removed from featured listings',
      addedHighlight: 'Domain added to featured listings',
      removeFeatured: 'Remove Featured',
      markAsFeatured: 'Mark as Featured',
      setAvailable: 'Set as Available',
      markAsSold: 'Mark as Sold',
      markAsReserved: 'Mark as Reserved'
    },
    verificationsSection: {
      loadError: 'Failed to load pending verifications',
      approveSuccess: 'Domain verification approved',
      approveError: 'Failed to approve verification',
      rejectSuccess: 'Domain verification rejected',
      rejectError: 'Failed to reject verification'
    },
    verifications: {
      title: 'Pending Domain Verifications',
      noPending: 'No pending verifications'
    }
  },

  // Verification
  verification: {
    methods: {
      dns: 'DNS Verification',
      html: 'HTML File Verification',
      email: 'Email Verification'
    }
  },

  // Notifications
  notifications: {
    verificationApproved: {
      title: 'Domain Verification Approved',
      message: 'Your domain {{domain}} has been verified and is now available for sale.'
    },
    verificationRejected: {
      title: 'Domain Verification Rejected',
      message: 'Your domain {{domain}} verification request was rejected. Please check domain ownership or contact platform administrators.'
    }
  },

  // User Center
  userCenter: {
    title: 'User Center',
    welcome: 'Welcome back',
    myDomains: 'My Domains',
    transactions: 'Transaction History',
    profile: 'Profile',
    settings: 'Settings'
  }
};
