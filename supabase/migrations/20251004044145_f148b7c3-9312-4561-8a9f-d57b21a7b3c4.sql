-- 清理所有测试数据，为上线做准备

-- 1. 清理域名相关数据
DELETE FROM domain_analytics;
DELETE FROM domain_price_history;
DELETE FROM domain_verifications;
DELETE FROM domain_offers;
DELETE FROM domain_shares;
DELETE FROM user_favorites;
DELETE FROM domain_listings;

-- 2. 清理用户活动和通知
DELETE FROM notifications;
DELETE FROM user_activities;

-- 3. 清理交易和拍卖数据
DELETE FROM auction_bids;
DELETE FROM domain_auctions;
DELETE FROM escrow_services;
DELETE FROM transactions;

-- 4. 清理评价数据
DELETE FROM user_reviews;

-- 5. 清理域名监控数据
DELETE FROM domain_monitoring_history;
DELETE FROM domain_monitoring;

-- 6. 清理域名估值数据
DELETE FROM domain_valuations;

-- 7. 清理域名销售设置
DELETE FROM domain_sale_settings;

-- 8. 重置序列（如果有的话）
-- 注意：Supabase使用UUID，所以不需要重置序列

-- 完成清理
COMMENT ON DATABASE postgres IS '数据库已清理，准备接收真实数据';
