
-- 删除与 nic.bn 域名相关的所有数据
-- 首先删除相关数据，然后删除主记录

-- 删除域名分析记录
DELETE FROM domain_analytics 
WHERE domain_id IN (
  SELECT id FROM domain_listings WHERE LOWER(name) = 'nic.bn'
);

-- 删除域名验证记录
DELETE FROM domain_verifications 
WHERE domain_id IN (
  SELECT id FROM domain_listings WHERE LOWER(name) = 'nic.bn'
);

-- 删除域名历史记录
DELETE FROM domain_history 
WHERE domain_id IN (
  SELECT id FROM domain_listings WHERE LOWER(name) = 'nic.bn'
);

-- 删除域名收藏记录
DELETE FROM user_favorites 
WHERE domain_id IN (
  SELECT id FROM domain_listings WHERE LOWER(name) = 'nic.bn'
);

-- 删除域名报价记录
DELETE FROM domain_offers 
WHERE domain_id IN (
  SELECT id FROM domain_listings WHERE LOWER(name) = 'nic.bn'
);

-- 删除域名价格历史记录
DELETE FROM domain_price_history 
WHERE domain_id IN (
  SELECT id FROM domain_listings WHERE LOWER(name) = 'nic.bn'
);

-- 删除域名销售设置
DELETE FROM domain_sale_settings 
WHERE domain_id IN (
  SELECT id FROM domain_listings WHERE LOWER(name) = 'nic.bn'
);

-- 删除域名分享记录
DELETE FROM domain_shares 
WHERE domain_id IN (
  SELECT id FROM domain_listings WHERE LOWER(name) = 'nic.bn'
);

-- 最后删除域名列表记录
DELETE FROM domain_listings WHERE LOWER(name) = 'nic.bn';

-- 如果 domains 表中也有相关记录，也删除
DELETE FROM domains WHERE LOWER(name) = 'nic.bn';
