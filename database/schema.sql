CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM (
  'guest',
  'member',
  'verified_member',
  'business_member',
  'moderator',
  'admin',
  'super_admin'
);

CREATE TYPE user_status AS ENUM (
  'active',
  'pending_verification',
  'suspended',
  'deleted'
);

CREATE TYPE membership_level AS ENUM (
  'iron',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'master',
  'master_plus'
);

CREATE TYPE content_status AS ENUM (
  'active',
  'hidden',
  'deleted',
  'pending_review'
);

CREATE TYPE report_status AS ENUM (
  'open',
  'reviewing',
  'resolved',
  'rejected'
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub text UNIQUE,
  email text UNIQUE,
  phone text UNIQUE,
  nickname text UNIQUE NOT NULL,
  referral_id text,
  role user_role NOT NULL DEFAULT 'member',
  membership_level membership_level NOT NULL DEFAULT 'iron',
  is_email_verified boolean NOT NULL DEFAULT false,
  is_phone_verified boolean NOT NULL DEFAULT false,
  accepted_terms_at timestamptz,
  confirmed_age_14_at timestamptz,
  status user_status NOT NULL DEFAULT 'pending_verification',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_or_phone_required CHECK (
    email IS NOT NULL OR phone IS NOT NULL
  )
);

CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_image_url text,
  profile_image_scale numeric(3, 2) NOT NULL DEFAULT 1.00,
  profile_image_x integer NOT NULL DEFAULT 0,
  profile_image_y integer NOT NULL DEFAULT 0,
  smartphone_number text,
  kakao_talk_id text,
  bio text,
  city text,
  suburb text,
  show_kakao_talk_id boolean NOT NULL DEFAULT false,
  show_phone_number boolean NOT NULL DEFAULT false,
  allow_chat boolean NOT NULL DEFAULT true,
  preferred_language text NOT NULL DEFAULT 'ko',
  interests text[] NOT NULL DEFAULT '{}',
  trade_area text,
  notification_comments boolean NOT NULL DEFAULT false,
  notification_saved_posts boolean NOT NULL DEFAULT false,
  notification_trade_messages boolean NOT NULL DEFAULT false,
  notification_settings jsonb NOT NULL DEFAULT '{}',
  residency_status text,
  has_car boolean,
  life_info_interests text[] NOT NULL DEFAULT '{}',
  business_name text,
  business_registration_number text,
  business_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  content text NOT NULL,
  price numeric(12, 2),
  location text,
  status content_status NOT NULL DEFAULT 'active',
  view_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  status content_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE post_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  s3_key text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  code_hash text NOT NULL,
  verification_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

CREATE TABLE saved_post_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE likes
  ADD COLUMN folder_id uuid REFERENCES saved_post_folders(id) ON DELETE SET NULL;

CREATE TABLE saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  is_quick_filter boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_buyer_blocked boolean NOT NULL DEFAULT false,
  is_seller_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chats_buyer_seller_different CHECK (buyer_id <> seller_id)
);

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scheduled_post_bumps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  repeat_rule text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE keyword_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  category_scope text[] NOT NULL DEFAULT ARRAY['marketplace', 'real_estate', 'jobs'],
  notify_in_app boolean NOT NULL DEFAULT true,
  notify_email boolean NOT NULL DEFAULT false,
  notify_push boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT keyword_alerts_keyword_min_length CHECK (char_length(trim(keyword)) >= 2),
  UNIQUE (user_id, keyword)
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  target_type text,
  target_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  detail text,
  status report_status NOT NULL DEFAULT 'open',
  handled_by uuid REFERENCES users(id) ON DELETE SET NULL,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  s3_key text,
  link_url text NOT NULL,
  position text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_membership_level ON users(membership_level);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_referral_id ON users(referral_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_posts_category_created ON posts(category_id, created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at ASC);
CREATE INDEX idx_email_verifications_expires ON email_verifications(expires_at);
CREATE INDEX idx_password_resets_user ON password_resets(user_id);
CREATE INDEX idx_password_resets_expires ON password_resets(expires_at);
CREATE INDEX idx_reports_status_created ON reports(status, created_at DESC);
CREATE INDEX idx_saved_post_folders_user ON saved_post_folders(user_id, sort_order);
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id, created_at DESC);
CREATE INDEX idx_favorites_user_created ON favorites(user_id, created_at DESC);
CREATE INDEX idx_chats_buyer_updated ON chats(buyer_id, updated_at DESC);
CREATE INDEX idx_chats_seller_updated ON chats(seller_id, updated_at DESC);
CREATE INDEX idx_chat_messages_chat_created ON chat_messages(chat_id, created_at ASC);
CREATE INDEX idx_scheduled_post_bumps_due ON scheduled_post_bumps(status, scheduled_at);
CREATE INDEX idx_keyword_alerts_user_created ON keyword_alerts(user_id, created_at DESC);
CREATE INDEX idx_keyword_alerts_active_keyword ON keyword_alerts(keyword) WHERE is_active = true;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_ads_position_active ON ads(position, is_active);
CREATE INDEX idx_admin_logs_admin_created ON admin_logs(admin_id, created_at DESC);
